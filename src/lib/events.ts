// NATS JetStream event publisher for digitika domain events.
// Publishes CloudEvents-style envelopes to `digitika.>` subjects.
// The notifications-api worker's digitika_consumer subscribes to these for email dispatch.
// HTTP notification calls in routes are skipped when NATS is configured (this is the primary path).

import { connect, StringCodec, NatsConnection, JetStreamClient } from 'nats';

const NATS_URL = process.env.EVENTS_NATS_URL ?? '';
const sc = StringCodec();

// Lazy singleton connection + JetStream client
let _nc: NatsConnection | null = null;
let _js: JetStreamClient | null = null;

async function getJS(): Promise<JetStreamClient | null> {
  if (!NATS_URL) return null;
  if (_nc && !_nc.isClosed() && _js) return _js;
  try {
    _nc = await connect({ servers: NATS_URL, timeout: 3000, maxReconnectAttempts: 3 });
    _js = _nc.jetstream();
    return _js;
  } catch (err) {
    console.warn('[events] NATS connect failed (non-fatal):', err);
    return null;
  }
}

export interface DigitikaEnrollmentEvent {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  courseCategory: string;
  paymentPlan: string;
  totalAmount: number;
  firstPaymentAmount: number;
  currency: string;
  cohortName?: string;
  portalLink: string;
  installmentsSummary?: string;
  tenantId: string;
}

export interface DigitikaPaymentEvent {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  installmentNo: number;
  totalInstallments: number;
  amountPaid: number;
  currency: string;
  paymentRef?: string;
  remainingBalance: number;
  nextInstallmentDate?: string;
  nextInstallmentAmount?: number;
  portalLink: string;
  tenantId: string;
}

async function publish(subject: string, data: Record<string, unknown>): Promise<void> {
  const js = await getJS();
  if (!js) return; // NATS not configured — HTTP API fallback handles notifications
  try {
    const payload = {
      id: crypto.randomUUID(),
      type: subject,
      tenant_id: data.tenantId ?? 'codevertex',
      timestamp: new Date().toISOString(),
      data,
    };
    await js.publish(subject, sc.encode(JSON.stringify(payload)));
    console.log(`[events] published: ${subject}`);
  } catch (err) {
    console.warn(`[events] publish failed for ${subject} (non-fatal):`, err);
  }
}

export async function publishEnrollmentConfirmed(event: DigitikaEnrollmentEvent): Promise<void> {
  await publish('digitika.enrollment.confirmed', event as unknown as Record<string, unknown>);
}

export async function publishInstallmentPaid(event: DigitikaPaymentEvent): Promise<void> {
  await publish('digitika.payment.succeeded', event as unknown as Record<string, unknown>);
}
