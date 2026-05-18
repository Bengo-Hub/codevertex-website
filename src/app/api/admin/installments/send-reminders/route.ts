// POST /api/admin/installments/send-reminders
// Called daily by the digitika-reminder-cron Kubernetes CronJob.
// Auth: X-API-Key (INTERNAL_SERVICE_KEY).
// Finds installments due within DAYS_AHEAD (default 3) that haven't been reminded recently,
// sends reminder emails via notifications-api, and updates reminderSentAt.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendInstallmentReminder, buildPortalLink } from '@/lib/notifications';

const SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY ?? '';

// Remind for installments due within this many days
const DAYS_AHEAD = 3;
// Don't re-send a reminder if one was sent within this many hours
const REMIND_COOLDOWN_HOURS = 20;

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-api-key') ?? '';
  if (!SERVICE_KEY || key !== SERVICE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const dueCutoff = new Date(now.getTime() + DAYS_AHEAD * 24 * 60 * 60 * 1000);
  const cooloffCutoff = new Date(now.getTime() - REMIND_COOLDOWN_HOURS * 60 * 60 * 1000);

  // Find unpaid installments due within DAYS_AHEAD days (including already overdue)
  // that haven't received a reminder in the last REMIND_COOLDOWN_HOURS hours
  const due = await prisma.installmentSchedule.findMany({
    where: {
      status: { in: ['pending', 'overdue', 'reminded'] },
      dueDate: { lte: dueCutoff },
      OR: [
        { reminderSentAt: null },
        { reminderSentAt: { lte: cooloffCutoff } },
      ],
    },
    include: {
      enrollment: {
        select: {
          id: true,
          fullName: true,
          email: true,
          courseName: true,
          studentUserId: true,
          paymentStatus: true,
          installments: { select: { installmentNo: true } },
        },
      },
    },
    orderBy: { dueDate: 'asc' },
    take: 200,
  });

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const installment of due) {
    const { enrollment } = installment;

    // Skip if enrollment is already fully paid
    if (enrollment.paymentStatus === 'succeeded' || enrollment.paymentStatus === 'paid') {
      skipped++;
      continue;
    }

    const totalInstallments = enrollment.installments.length;
    const daysUntilDue = Math.ceil(
      (installment.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    try {
      await sendInstallmentReminder({
        studentName: enrollment.fullName,
        studentEmail: enrollment.email,
        courseName: enrollment.courseName,
        installmentNo: installment.installmentNo,
        totalInstallments,
        amount: installment.amount,
        currency: installment.currency,
        dueDate: installment.dueDate.toISOString().split('T')[0],
        enrollmentId: enrollment.id.toString(),
        studentId: enrollment.studentUserId ?? '',
        daysUntilDue,
        portalLink: buildPortalLink(enrollment.id, enrollment.studentUserId ?? ''),
      });

      await prisma.installmentSchedule.update({
        where: { id: installment.id },
        data: {
          reminderSentAt: new Date(),
          status: daysUntilDue < 0 ? 'overdue' : 'reminded',
        },
      });

      sent++;
    } catch (err) {
      errors.push(`installment ${installment.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`[send-reminders] sent=${sent} skipped=${skipped} errors=${errors.length}`);

  return NextResponse.json({
    sent,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}
