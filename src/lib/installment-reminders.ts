// Installment reminders, one implementation for the daily cron and the admin's manual "send
// reminder". The website publishes `digitika.installment.reminder`; notifications-api's digitika
// consumer sends it to the learner and any guardian on email and WhatsApp.

import { prisma } from '@/lib/db';
import { buildPortalLink, publishInstallmentReminder } from '@/lib/events';
import { daysUntil } from '@/lib/installments';
import { noticePeople } from '@/lib/notice-contacts';

/** Remind for an installment due within this many days (already overdue ones included). */
export const REMIND_DAYS_AHEAD = 3;
/** Between reminders before the due date. */
const COOLDOWN_BEFORE_DUE_HOURS = 20;
/** Between reminders once overdue: every three days, not daily. */
const COOLDOWN_OVERDUE_HOURS = 72;
/** Installments handled per database round trip. */
const BATCH = 100;
/** An upper bound for one run, so a backlog never makes the cron job run for ever. */
const MAX_PER_RUN = 2000;

const hoursAgo = (now: Date, h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);

const reminderSelect = {
  id: true,
  installmentNo: true,
  amount: true,
  currency: true,
  dueDate: true,
  enrollment: {
    select: {
      id: true,
      courseName: true,
      paymentStatus: true,
      studentUserId: true,
      installments: { select: { installmentNo: true } },
      studentUser: {
        select: { id: true, fullName: true, email: true, phone: true, guardianName: true, guardianEmail: true, guardianPhone: true },
      },
    },
  },
} as const;

export type ReminderRow = Awaited<ReturnType<typeof loadBatch>>[number];

async function loadBatch(now: Date, afterId: bigint) {
  const dueCutoff = new Date(now.getTime() + REMIND_DAYS_AHEAD * 24 * 60 * 60 * 1000);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return prisma.installmentSchedule.findMany({
    where: {
      id: { gt: afterId },
      status: { in: ['pending', 'overdue', 'reminded'] },
      dueDate: { lte: dueCutoff },
      // The installment row itself says whether it is paid. The enrollment's own status is
      // 'succeeded' from the FIRST payment on, so it must never decide whether a later
      // installment is owed. Refunded or failed enrollments are not chased.
      enrollment: { paymentStatus: { notIn: ['refunded', 'failed'] } },
      OR: [
        // Not yet due: at most one a day.
        { dueDate: { gte: today }, OR: [{ reminderSentAt: null }, { reminderSentAt: { lte: hoursAgo(now, COOLDOWN_BEFORE_DUE_HOURS) } }] },
        // Overdue: every three days.
        { dueDate: { lt: today }, OR: [{ reminderSentAt: null }, { reminderSentAt: { lte: hoursAgo(now, COOLDOWN_OVERDUE_HOURS) } }] },
      ],
    },
    select: reminderSelect,
    orderBy: { id: 'asc' },
    take: BATCH,
  });
}

/**
 * Publishes the reminder for one installment and marks it. The row is marked only when the event
 * was published, so a NATS outage leaves it due for the next run instead of silently skipping it.
 */
export async function remindInstallment(row: ReminderRow, now = new Date()): Promise<boolean> {
  const { enrollment } = row;
  const student = enrollment.studentUser;
  if (!student) return false;
  const days = daysUntil(row.dueDate, now);
  const published = await publishInstallmentReminder({
    ...noticePeople(student),
    enrollmentId: enrollment.id.toString(),
    courseName: enrollment.courseName,
    installmentNo: row.installmentNo,
    totalInstallments: enrollment.installments.length,
    amount: row.amount,
    currency: row.currency,
    dueDate: row.dueDate.toISOString().split('T')[0],
    daysUntilDue: days,
    portalLink: buildPortalLink(enrollment.id, student.id),
  });
  if (!published) return false;
  await prisma.installmentSchedule.update({
    where: { id: row.id },
    data: { reminderSentAt: now, status: days < 0 ? 'overdue' : 'reminded' },
  });
  return true;
}

export interface ReminderRun {
  sent: number;
  failed: number;
  errors: string[];
}

/** Sends every reminder that is due, in batches. Used by the daily cron job. */
export async function runDueReminders(now = new Date()): Promise<ReminderRun> {
  const run: ReminderRun = { sent: 0, failed: 0, errors: [] };
  let afterId = BigInt(0);
  let handled = 0;
  while (handled < MAX_PER_RUN) {
    const rows = await loadBatch(now, afterId);
    if (rows.length === 0) break;
    for (const row of rows) {
      afterId = row.id;
      handled++;
      try {
        if (await remindInstallment(row, now)) run.sent++;
        else run.failed++;
      } catch (err) {
        run.failed++;
        if (run.errors.length < 20) run.errors.push(`installment ${row.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    if (rows.length < BATCH) break;
  }
  return run;
}

/** The row for one installment, in the shape remindInstallment takes (manual reminder). */
export function loadReminderRow(id: bigint) {
  return prisma.installmentSchedule.findUnique({ where: { id }, select: reminderSelect });
}
