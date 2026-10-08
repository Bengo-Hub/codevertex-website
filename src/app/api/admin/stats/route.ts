import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

// Admin dashboard KPIs. Everything is aggregated in Postgres (counts, sums, a 6-month
// series) so the payload and cost stay constant as enrollments grow; the browser never
// receives raw enrollment lists beyond the few rows shown in "Recent activity".

const PAID_ENROLLMENT_STATUSES = ['succeeded', 'paid'];
const OPEN_INSTALLMENT_STATUSES = ['pending', 'reminded', 'overdue'];
const TREND_MONTHS = 6;
const RECENT_ACTIVITY = 6;

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('dashboard', 'view'));
  if ('response' in guard) return guard.response;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const weekAhead = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    enrollmentsByStatus,
    totalStudents,
    leadsByStatus,
    totalContacts,
    overdueInstallments,
    upcomingInstallments,
    revenueRows,
    trendRows,
    recentEnrollments,
  ] = await Promise.all([
    prisma.enrollment.groupBy({ by: ['paymentStatus'], _count: { _all: true } }),
    prisma.studentUser.count(),
    prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.contactSubmission.count(),
    // Overdue = unpaid and past due, whether or not the reminder cron has flipped its status yet.
    prisma.installmentSchedule.count({
      where: { status: { in: OPEN_INSTALLMENT_STATUSES }, dueDate: { lt: today } },
    }),
    prisma.installmentSchedule.count({
      where: { status: { in: OPEN_INSTALLMENT_STATUSES }, dueDate: { gte: today, lte: weekAhead } },
    }),
    // Cash collected = paid installments + upfront enrollments (no installment rows) that succeeded.
    prisma.$queryRaw<{ collected: bigint | null }[]>(Prisma.sql`
      SELECT
        COALESCE((SELECT SUM(amount) FROM installment_schedules WHERE status = 'paid'), 0)
        + COALESCE((
            SELECT SUM(e.amount) FROM enrollments e
            WHERE e.payment_status IN (${Prisma.join(PAID_ENROLLMENT_STATUSES)})
              AND NOT EXISTS (SELECT 1 FROM installment_schedules i WHERE i.enrollment_id = e.id)
          ), 0) AS collected
    `),
    // Monthly enrollments (by created date) and cash collected (by payment date), last N months.
    prisma.$queryRaw<{ month: string; enrollments: bigint; revenue: bigint }[]>(Prisma.sql`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', now()) - make_interval(months => ${TREND_MONTHS - 1}),
          date_trunc('month', now()),
          interval '1 month'
        ) AS m
      ),
      bounds AS (SELECT MIN(m) AS start FROM months),
      enr AS (
        SELECT date_trunc('month', created_at) AS m, COUNT(*) AS c
        FROM enrollments, bounds WHERE created_at >= bounds.start GROUP BY 1
      ),
      cash AS (
        SELECT date_trunc('month', paid_at) AS m, SUM(amount) AS amt
        FROM installment_schedules, bounds
        WHERE status = 'paid' AND paid_at >= bounds.start GROUP BY 1
        UNION ALL
        SELECT date_trunc('month', e.created_at) AS m, SUM(e.amount) AS amt
        FROM enrollments e, bounds
        WHERE e.created_at >= bounds.start
          AND e.payment_status IN (${Prisma.join(PAID_ENROLLMENT_STATUSES)})
          AND NOT EXISTS (SELECT 1 FROM installment_schedules i WHERE i.enrollment_id = e.id)
        GROUP BY 1
      )
      SELECT to_char(months.m, 'YYYY-MM') AS month,
             COALESCE(enr.c, 0) AS enrollments,
             COALESCE((SELECT SUM(cash.amt) FROM cash WHERE cash.m = months.m), 0) AS revenue
      FROM months LEFT JOIN enr ON enr.m = months.m
      ORDER BY months.m
    `),
    prisma.enrollment.findMany({
      orderBy: { createdAt: 'desc' },
      take: RECENT_ACTIVITY,
      select: { id: true, createdAt: true, amount: true, paymentStatus: true, fullName: true, courseName: true },
    }),
  ]);

  const countOf = (rows: { _count: { _all: number } }[]) => rows.reduce((s, r) => s + r._count._all, 0);
  const totalEnrollments = countOf(enrollmentsByStatus);
  const succeeded = countOf(enrollmentsByStatus.filter((r) => PAID_ENROLLMENT_STATUSES.includes(r.paymentStatus)));
  const pending = countOf(enrollmentsByStatus.filter((r) => r.paymentStatus === 'pending'));

  return NextResponse.json({
    enrollments: { total: totalEnrollments, pending, succeeded },
    students: { total: totalStudents },
    leads: { total: countOf(leadsByStatus), new: countOf(leadsByStatus.filter((r) => r.status === 'new')) },
    contacts: { total: totalContacts },
    installments: { overdue: overdueInstallments, upcomingWeek: upcomingInstallments },
    revenue: { collected: Number(revenueRows[0]?.collected ?? 0), currency: 'KES' },
    monthlyTrend: trendRows.map((r) => ({ month: r.month, enrollments: Number(r.enrollments), revenue: Number(r.revenue) })),
    recentEnrollments: recentEnrollments.map((e) => ({ ...e, id: e.id.toString() })),
  });
}
