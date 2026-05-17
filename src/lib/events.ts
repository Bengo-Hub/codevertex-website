// NATS JetStream event publisher for digitika domain events.
// Events are published in the platform-standard shared-events format:
//   { id, event_type, aggregate_type, aggregate_id, tenant_id, tenant_slug, payload, metadata, timestamp, version }
// Subject pattern: {aggregate_type}.{event_type}  (e.g. digitika.enrollment.confirmed)
// The notifications-api worker's digitika_consumer subscribes to digitika.> for email dispatch.
// HTTP notification calls in routes are skipped when EVENTS_NATS_URL is set (consumer handles emails).

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

// publish emits a platform-standard event to NATS JetStream.
// Subject: {aggregateType}.{eventType}  (e.g. digitika.enrollment.confirmed)
async function publish(
  eventType: string,
  aggregateType: string,
  aggregateId: string,
  tenantSlug: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const js = await getJS();
  if (!js) return; // NATS not configured — HTTP API fallback handles notifications

  const subject = `${aggregateType}.${eventType}`;
  try {
    const envelope = {
      id: crypto.randomUUID(),
      event_type: eventType,
      aggregate_type: aggregateType,
      aggregate_id: aggregateId,
      tenant_id: tenantSlug,
      tenant_slug: tenantSlug,
      payload,
      metadata: {},
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    await js.publish(subject, sc.encode(JSON.stringify(envelope)));
    console.log(`[events] published: ${subject}`);
  } catch (err) {
    console.warn(`[events] publish failed for ${subject} (non-fatal):`, err);
  }
}

export async function publishEnrollmentConfirmed(event: DigitikaEnrollmentEvent): Promise<void> {
  await publish(
    'enrollment.confirmed',
    'digitika',
    event.enrollmentId,
    event.tenantId,
    event as unknown as Record<string, unknown>,
  );
}

export async function publishInstallmentPaid(event: DigitikaPaymentEvent): Promise<void> {
  await publish(
    'payment.succeeded',
    'digitika',
    event.enrollmentId,
    event.tenantId,
    event as unknown as Record<string, unknown>,
  );
}
