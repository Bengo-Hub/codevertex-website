// NATS JetStream event publisher for digitika domain events.
// Events are published in the platform-standard shared-events format:
//   { id, event_type, aggregate_type, aggregate_id, tenant_id, tenant_slug, payload, metadata, timestamp, version }
// Subject pattern: {aggregate_type}.{event_type}  (e.g. digitika.enrollment.confirmed)
//
// notifications-api's digitika consumer is the ONLY sender of Digitika emails and WhatsApp
// messages: this site publishes what happened (with the learner's and guardian's contacts) and
// the consumer decides who is told, on which channel, with which template. There is no HTTP
// fallback: a second delivery path would send things twice or word them differently.

import { connect, StringCodec, NatsConnection, JetStreamClient } from 'nats';
import type { NoticePeople } from '@/lib/notice-contacts';

const NATS_URL = process.env.EVENTS_NATS_URL ?? '';
const TENANT = 'codevertex';
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

/**
 * Emits a platform-standard event. Returns whether it was published, so a caller that must not
 * lose the notice (a reminder) can leave its record unmarked and try again on the next run.
 */
async function publish(
  eventType: string,
  aggregateId: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  const js = await getJS();
  if (!js) {
    console.warn(`[events] NATS not configured: digitika.${eventType} not published`);
    return false;
  }
  const subject = `digitika.${eventType}`;
  try {
    const envelope = {
      id: crypto.randomUUID(),
      event_type: eventType,
      aggregate_type: 'digitika',
      aggregate_id: aggregateId,
      tenant_id: TENANT,
      tenant_slug: TENANT,
      payload,
      metadata: {},
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    await js.publish(subject, sc.encode(JSON.stringify(envelope)));
    console.log(`[events] published: ${subject}`);
    return true;
  } catch (err) {
    console.warn(`[events] publish failed for ${subject} (non-fatal):`, err);
    return false;
  }
}

export interface DigitikaEnrollmentEvent extends NoticePeople {
  enrollmentId: string;
  courseName: string;
  courseCategory: string;
  paymentPlan: string;
  totalAmount: number;
  firstPaymentAmount: number;
  currency: string;
  cohortName?: string;
  portalLink: string;
  installmentsSummary?: string;
}

export interface DigitikaPaymentEvent extends NoticePeople {
  enrollmentId: string;
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
}

export interface DigitikaReminderEvent extends NoticePeople {
  enrollmentId: string;
  courseName: string;
  installmentNo: number;
  totalInstallments: number;
  amount: number;
  currency: string;
  /** YYYY-MM-DD */
  dueDate: string;
  /** Negative once overdue. */
  daysUntilDue: number;
  portalLink: string;
}

export interface DigitikaAccountEvent {
  accountRole: 'student' | 'parent';
  name: string;
  email: string;
  phone?: string;
  courseName: string;
  /** The learner, for a parent's account. */
  studentName: string;
  /** Only for a brand-new account; shown by email only, never on WhatsApp. */
  tempPassword?: string;
  loginUrl: string;
}

export interface DigitikaAccessCodeEvent {
  name: string;
  email?: string;
  phone?: string;
  code: string;
  ttlMinutes: number;
}

export interface DigitikaContactEvent {
  name: string;
  email: string;
  phone: string;
  message: string;
  /** Topic value from the form (a product or service id). */
  service?: string;
  /** Readable topic name for the reply and the team alert. */
  serviceLabel?: string;
  source?: 'contact' | 'attachment';
}

export interface DigitikaCertificateEvent extends NoticePeople {
  courseName: string;
  certificateNumber: string;
  certificateLink: string;
}

const asPayload = (e: object) => e as unknown as Record<string, unknown>;

export const publishEnrollmentConfirmed = (e: DigitikaEnrollmentEvent) =>
  publish('enrollment.confirmed', e.enrollmentId, asPayload(e));

export const publishInstallmentPaid = (e: DigitikaPaymentEvent) =>
  publish('payment.succeeded', e.enrollmentId, asPayload(e));

export const publishInstallmentReminder = (e: DigitikaReminderEvent) =>
  publish('installment.reminder', e.enrollmentId, asPayload(e));

export const publishAccountCreated = (e: DigitikaAccountEvent) =>
  publish('account.created', e.email || e.phone || e.name, asPayload(e));

export const publishAccessCode = (e: DigitikaAccessCodeEvent) =>
  publish('access_code.requested', e.email || e.phone || e.name, asPayload(e));

export const publishContactReceived = (e: DigitikaContactEvent) =>
  publish('contact.received', e.email, asPayload(e));

export const publishCertificateIssued = (e: DigitikaCertificateEvent) =>
  publish('certificate.issued', e.certificateNumber, asPayload(e));

/** The link that opens an enrollment (receipt, schedule, pay). */
export function buildPortalLink(enrollmentId: string | bigint, studentId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://codevertexafrica.com';
  return `${base}/digitika/success?reference=DGT-${enrollmentId}-DGT-${studentId}`;
}
