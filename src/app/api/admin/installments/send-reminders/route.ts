// POST /api/admin/installments/send-reminders
// Called daily by the digitika-installment-reminder Kubernetes CronJob.
// Auth: X-API-Key (INTERNAL_SERVICE_KEY).
// Publishes a reminder event for every installment due within REMIND_DAYS_AHEAD days or overdue
// (src/lib/installment-reminders.ts decides who is due); notifications-api sends them to the
// learner and any guardian on email and WhatsApp.

import { NextRequest, NextResponse } from 'next/server';
import { runDueReminders } from '@/lib/installment-reminders';

const SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY ?? '';

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-api-key') ?? '';
  if (!SERVICE_KEY || key !== SERVICE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const run = await runDueReminders();
  console.log(`[send-reminders] sent=${run.sent} failed=${run.failed}`);
  return NextResponse.json({ sent: run.sent, failed: run.failed, errors: run.errors.length > 0 ? run.errors : undefined });
}
