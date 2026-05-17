// Notifications-api S2S integration — sends emails via the platform notifications service.
// Auth: X-API-Key (INTERNAL_SERVICE_KEY) validated against auth-api.
// Endpoint: POST /api/v1/notifications/messages
// Tenant is resolved from the service key (codevertex tenant).

const NOTIFICATIONS_URL =
  process.env.NOTIFICATIONS_API_URL ?? 'https://notificationsapi.codevertexitsolutions.com';
const SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY ?? '';
const TENANT = 'codevertex';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://codevertexitsolutions.com';

export interface EnrollmentConfirmationData {
  studentName: string;
  studentEmail: string;
  courseName: string;
  courseCategory: string;
  paymentPlan: string;
  firstPaymentAmount: number;
  totalAmount: number;
  currency: string;
  studentId: string;
  enrollmentId: string;
  remainingBalance: number;
  cohortName?: string;
  portalLink: string;
  installmentsSummary?: string;
}

export interface InstallmentReminderData {
  studentName: string;
  studentEmail: string;
  courseName: string;
  installmentNo: number;
  totalInstallments: number;
  amount: number;
  currency: string;
  dueDate: string;
  enrollmentId: string;
  studentId: string;
  daysUntilDue: number;
  portalLink: string;
}

export interface InstallmentReceiptData {
  studentName: string;
  studentEmail: string;
  courseName: string;
  installmentNo: number;
  totalInstallments: number;
  amountPaid: number;
  currency: string;
  paymentRef?: string;
  studentId: string;
  enrollmentId: string;
  remainingBalance: number;
  nextInstallmentDate?: string;
  nextInstallmentAmount?: number;
  portalLink: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
  service?: string;
}

async function postNotification(
  template: string,
  to: string,
  data: Record<string, unknown>,
  subject: string,
  requestId?: string
): Promise<void> {
  if (!SERVICE_KEY) {
    console.warn('[notifications] INTERNAL_SERVICE_KEY not set — skipping email');
    return;
  }

  try {
    const res = await fetch(`${NOTIFICATIONS_URL}/api/v1/notifications/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SERVICE_KEY,
        'X-Request-ID': requestId ?? crypto.randomUUID(),
      },
      body: JSON.stringify({
        channel: 'email',
        tenant: TENANT,
        template,
        to: [to],
        data,
        metadata: { subject },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[notifications] email failed (${res.status}): ${body}`);
    } else {
      console.log(`[notifications] email queued: template=${template} to=${to}`);
    }
  } catch (err) {
    console.error('[notifications] email send error:', err);
  }
}

export async function sendEnrollmentConfirmation(
  data: EnrollmentConfirmationData,
  requestId?: string
): Promise<void> {
  await postNotification(
    'digitika/enrollment_confirmed',
    data.studentEmail,
    {
      student_name: data.studentName,
      course_name: data.courseName,
      payment_plan: data.paymentPlan,
      total_amount: data.totalAmount.toLocaleString(),
      currency: data.currency,
      student_id: data.studentId,
      cohort_name: data.cohortName ?? '',
      portal_link: data.portalLink,
      installments_summary: data.installmentsSummary ?? '',
    },
    `Enrollment Confirmed — ${data.courseName}`,
    requestId
  );
}

export async function sendInstallmentReminder(
  data: InstallmentReminderData,
  requestId?: string
): Promise<void> {
  const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th'];
  const label = ORDINALS[data.installmentNo] ?? `${data.installmentNo}th`;
  await postNotification(
    'digitika/installment_reminder',
    data.studentEmail,
    {
      student_name: data.studentName,
      course_name: data.courseName,
      payment_label: label,
      total_installments: data.totalInstallments,
      amount: data.amount.toLocaleString(),
      currency: data.currency,
      due_date: data.dueDate,
      days_until_due: data.daysUntilDue,
      student_id: data.studentId,
      portal_link: data.portalLink,
    },
    `Payment Reminder — ${label} Installment Due: ${data.courseName}`,
    requestId
  );
}

export async function sendInstallmentReceipt(
  data: InstallmentReceiptData,
  requestId?: string
): Promise<void> {
  const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th'];
  const label = ORDINALS[data.installmentNo] ?? `${data.installmentNo}th`;
  await postNotification(
    'digitika/installment_receipt',
    data.studentEmail,
    {
      student_name: data.studentName,
      course_name: data.courseName,
      payment_label: label,
      amount_paid: data.amountPaid.toLocaleString(),
      currency: data.currency,
      payment_ref: data.paymentRef ?? '',
      remaining_balance: data.remainingBalance > 0 ? data.remainingBalance.toLocaleString() : '',
      next_installment_date: data.nextInstallmentDate ?? '',
      next_installment_amount: data.nextInstallmentAmount ? data.nextInstallmentAmount.toLocaleString() : '',
      student_id: data.studentId,
      portal_link: data.portalLink,
    },
    `Payment Received — ${label} Installment: ${data.courseName}`,
    requestId
  );
}

export async function sendContactFormReply(data: ContactFormData, requestId?: string): Promise<void> {
  await postNotification(
    'digitika/contact_form_reply',
    data.email,
    {
      name: data.name,
      email: data.email,
      message: data.message,
      service: data.service ?? '',
    },
    `We received your message — Codevertex IT Solutions`,
    requestId
  );
}

export function buildPortalLink(enrollmentId: string | bigint, studentId: string): string {
  return `${APP_URL}/digitika/success?reference=DGT-${enrollmentId}-DGT-${studentId}`;
}
