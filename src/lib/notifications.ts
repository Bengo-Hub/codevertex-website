// Notifications-api S2S integration — sends emails via the platform notifications service.
// Auth: X-API-Key (INTERNAL_SERVICE_KEY) validated against auth-api.
// Endpoint: POST /api/v1/notifications/messages
// Tenant is resolved from the service key (codevertex tenant).

const NOTIFICATIONS_URL =
  process.env.NOTIFICATIONS_API_URL ?? 'https://notificationsapi.codevertexitsolutions.com';
const SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY ?? '';
const TENANT = 'codevertex';

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

async function postNotification(
  template: string,
  to: string,
  data: Record<string, unknown>,
  subject: string
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
  data: EnrollmentConfirmationData
): Promise<void> {
  await postNotification(
    'enrollment_confirmed',
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
    `Enrollment Confirmed — ${data.courseName}`
  );
}

export async function sendInstallmentReminder(
  data: InstallmentReminderData
): Promise<void> {
  await postNotification(
    'enrollment_confirmed',
    data.studentEmail,
    {
      student_name: data.studentName,
      course_name: data.courseName,
      payment_plan: `Installment ${data.installmentNo} of ${data.totalInstallments}`,
      total_amount: data.amount.toLocaleString(),
      currency: data.currency,
      student_id: data.studentId,
      portal_link: data.portalLink,
      installments_summary: `Due on ${data.dueDate} — ${data.daysUntilDue} days remaining`,
    },
    `Installment ${data.installmentNo} Due — ${data.courseName}`
  );
}
