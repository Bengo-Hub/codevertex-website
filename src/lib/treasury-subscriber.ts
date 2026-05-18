// Background NATS subscriber that listens for treasury.payment.succeeded events
// and updates the local Prisma DB so the enrollment success page shows correct payment status.
// Runs in the Next.js Node.js process via instrumentation.ts.
// Stream: treasury  Subject: treasury.payment.succeeded  Consumer: codevertex-website-treasury

import { prisma } from './db';

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

            await updateEnrollmentPayment(enrollmentId, paidAmount, provider_reference ?? null);
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
): Promise<void> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { installments: { orderBy: { installmentNo: 'asc' } } },
  });

  if (!enrollment) {
    console.error('[treasury-subscriber] enrollment not found:', enrollmentId.toString());
    return;
  }

  if (enrollment.paymentStatus === 'succeeded' && enrollment.installments.some((i) => i.status === 'paid')) {
    console.log(`[treasury-subscriber] enrollment ${enrollmentId} already recorded — skipping`);
    return;
  }

  const unpaidInsts = enrollment.installments.filter((i) => i.status !== 'paid');
  const nextInst = unpaidInsts[0];

  if (nextInst) {
    await prisma.installmentSchedule.update({
      where: { id: nextInst.id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paymentRef: paymentRef ?? null,
        amount: paidAmount > 0 ? paidAmount : nextInst.amount,
      },
    });

    if (paidAmount > 0 && paidAmount > nextInst.amount && unpaidInsts.length > 1) {
      const totalPaidSoFar =
        enrollment.installments.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0) +
        paidAmount;
      const totalAmount = enrollment.totalAmount ?? enrollment.amount;
      const remainingBalance = Math.max(0, totalAmount - totalPaidSoFar);
      const remainingInsts = unpaidInsts.slice(1);

      if (remainingInsts.length > 0 && remainingBalance > 0) {
        const perInst = Math.ceil(remainingBalance / remainingInsts.length);
        for (let i = 0; i < remainingInsts.length; i++) {
          const isLast = i === remainingInsts.length - 1;
          const newAmount = isLast
            ? remainingBalance - perInst * (remainingInsts.length - 1)
            : perInst;
          await prisma.installmentSchedule.update({
            where: { id: remainingInsts[i].id },
            data: { amount: newAmount },
          });
        }
      } else if (remainingBalance <= 0) {
        await prisma.installmentSchedule.updateMany({
          where: { enrollmentId, status: { not: 'paid' } },
          data: { status: 'paid', paidAt: new Date(), paymentRef: paymentRef ?? null },
        });
      }
    }
  }

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      paymentStatus: 'succeeded',
      paymentRef: paymentRef ?? null,
      notifiedAt: new Date(),
    },
  });

  console.log(`[treasury-subscriber] enrollment ${enrollmentId} payment recorded (ref=${paymentRef})`);
}
