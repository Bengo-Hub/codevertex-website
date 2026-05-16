// Notifications-api integration — S2S email via NATS
// Sends emails through the platform notifications service.

const NOTIFICATIONS_URL =
  process.env.NOTIFICATIONS_API_URL ?? 'https://notificationsapi.codevertexitsolutions.com';
const SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY ?? '';

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
  installments?: {
    installmentNo: number;
    amount: number;
    dueDate: string;
    label: string;
  }[];
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
}

async function postNotification(
  template: string,
  to: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!SERVICE_KEY) {
    console.warn('[notifications] INTERNAL_SERVICE_KEY not set — skipping email');
    return;
  }

  try {
    const res = await fetch(`${NOTIFICATIONS_URL}/api/v1/s2s/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SERVICE_KEY,
      },
      body: JSON.stringify({ to, template, data }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[notifications] email failed (${res.status}): ${body}`);
    }
  } catch (err) {
    console.error('[notifications] email send error:', err);
  }
}

export async function sendEnrollmentConfirmation(
  data: EnrollmentConfirmationData
): Promise<void> {
  await postNotification('digitika_enrollment_confirmed', data.studentEmail, data as unknown as Record<string, unknown>);
}

export async function sendInstallmentReminder(
  data: InstallmentReminderData
): Promise<void> {
  await postNotification('digitika_installment_reminder', data.studentEmail, data as unknown as Record<string, unknown>);
}
