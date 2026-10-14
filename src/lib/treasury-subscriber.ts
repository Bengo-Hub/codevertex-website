// Background NATS subscriber that listens for treasury.payment.succeeded events
// and updates the local Prisma DB so the enrollment success page shows correct payment status.
// Runs in the Next.js Node.js process via instrumentation.ts.
// Stream: treasury  Subject: treasury.payment.succeeded  Consumer: codevertex-website-treasury

import { prisma } from './db';
import { provisionEnrollmentAccounts } from './portal-accounts';
import { applyEnrollmentPayment, publishPaymentReceipt, PaymentRejected } from './enrollment-payments';

interface TreasuryEventEnvelope {
  id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  tenant_id: string;
  tenant_slug: string;
  payload: {
    reference_id?: string;
    reference_type?: string;
    amount?: string;
    currency?: string;
    payment_method?: string;
    status?: string;
    provider?: string;
    provider_reference?: string;
  };
  timestamp: string;
  version?: string;
}

export async function startTreasuryEventSubscriber(): Promise<void> {
  const NATS_URL = process.env.EVENTS_NATS_URL;
  if (!NATS_URL) {
    console.log('[treasury-subscriber] EVENTS_NATS_URL not set — skipping subscriber');
    return;
  }

  const { connect, StringCodec, AckPolicy, DeliverPolicy } = await import('nats');
  const sc = StringCodec();

  const attemptConnect = async (): Promise<void> => {
    let nc: Awaited<ReturnType<typeof connect>> | null = null;
    try {
      nc = await connect({
        servers: NATS_URL,
        timeout: 5000,
        maxReconnectAttempts: -1,
        reconnectTimeWait: 2000,
      });

      console.log('[treasury-subscriber] connected to NATS');

      const jsm = await nc.jetstreamManager();
      const js = nc.jetstream();

      // Ensure durable consumer exists (upsert — idempotent)
      try {
        await jsm.consumers.add('treasury', {
          durable_name: 'codevertex-website-treasury',
          filter_subject: 'treasury.payment.succeeded',
          ack_policy: AckPolicy.Explicit,
          deliver_policy: DeliverPolicy.New,
        });
      } catch (err: unknown) {
        // Consumer already exists — that's fine
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes('consumer name already in use') && !msg.includes('existing consumer')) {
          throw err;
        }
      }

      const consumer = await js.consumers.get('treasury', 'codevertex-website-treasury');
      const messages = await consumer.consume();

      console.log('[treasury-subscriber] subscribed to treasury.payment.succeeded');

      (async () => {
        for await (const msg of messages) {
          try {
            const raw = sc.decode(msg.data);
            const event: TreasuryEventEnvelope = JSON.parse(raw);

            if (event.event_type !== 'payment.succeeded') {
              msg.ack();
              continue;
            }

            const { reference_id, reference_type, amount, provider_reference } = event.payload;

            if (reference_type !== 'digitika_enrollment' || !reference_id) {
              msg.ack();
              continue;
            }

            const match = reference_id.match(/^DGT-(\d+)-/);
            if (!match) {
              msg.ack();
              continue;
            }

            const enrollmentId = BigInt(match[1]);
            const paidAmount = amount ? parseFloat(amount) : 0;

            await updateEnrollmentPayment(enrollmentId, paidAmount, provider_reference ?? null, event.id);
            msg.ack();
          } catch (err) {
            console.error('[treasury-subscriber] error processing message:', err);
            // Don't ack — JetStream will redeliver
          }
        }
      })().catch((err) => {
        console.error('[treasury-subscriber] subscription loop error:', err);
      });

      nc.closed().then(() => {
        console.log('[treasury-subscriber] NATS connection closed, reconnecting in 5s...');
        setTimeout(attemptConnect, 5000);
      });
    } catch (err) {
      console.warn('[treasury-subscriber] connect failed, retrying in 10s:', err);
      if (nc) {
        nc.close().catch(() => {});
      }
      setTimeout(attemptConnect, 10000);
    }
  };

  attemptConnect().catch(() => {});
}

async function updateEnrollmentPayment(
  enrollmentId: bigint,
  paidAmount: number,
  paymentRef: string | null,
  eventId: string,
): Promise<void> {
  // Idempotency claim per platform-standards/idempotency-and-outbox: dedup on the
  // event envelope's own id, not on enrollment/installment state. The previous
  // "paymentStatus === 'succeeded' && some installment paid" check correctly caught a
  // *redelivery* of the same message, but also incorrectly swallowed a genuinely new,
  // later payment on a multi-installment enrollment (e.g. installment #2's real payment
  // arriving after #1 already flipped paymentStatus to 'succeeded') — silently dropping
  // a real payment with no receipt, no event, no error.
  try {
    await prisma.processedWebhookEvent.create({ data: { eventKey: eventId, source: 'treasury-nats' } });
  } catch {
    console.log(`[treasury-subscriber] duplicate delivery ignored: ${eventId}`);
    return;
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { installments: { where: { status: { not: 'paid' } }, orderBy: { installmentNo: 'asc' }, take: 1 } },
  });
  if (!enrollment) {
    console.error('[treasury-subscriber] enrollment not found:', enrollmentId.toString());
    return;
  }

  // The amount treasury says was paid; an event without one counts as the next installment
  // (or the full first payment of an upfront enrollment).
  const received = Math.round(paidAmount > 0 ? paidAmount : (enrollment.installments[0]?.amount ?? enrollment.amount));
  let applied;
  try {
    applied = await applyEnrollmentPayment(enrollmentId, received, { paymentRef });
  } catch (err) {
    if (err instanceof PaymentRejected) {
      console.warn(`[treasury-subscriber] enrollment ${enrollmentId}: ${err.message} (ref=${paymentRef})`);
      return;
    }
    throw err;
  }
  publishPaymentReceipt(applied, paymentRef).catch((err) =>
    console.error('[treasury-subscriber] receipt event failed:', err)
  );

  // First confirmed payment: the learner (and a minor's guardian) get their portal accounts.
  // Idempotent, so later installments just find the accounts already there.
  provisionEnrollmentAccounts(enrollmentId).catch((err) =>
    console.error('[treasury-subscriber] portal account provisioning failed:', err)
  );

  console.log(`[treasury-subscriber] enrollment ${enrollmentId} payment recorded (ref=${paymentRef})`);
}
