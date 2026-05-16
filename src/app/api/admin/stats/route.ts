import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const [
    totalEnrollments,
    pendingEnrollments,
    succeededEnrollments,
    totalStudents,
    totalLeads,
    newLeads,
    totalContacts,
    overdueInstallments,
    upcomingInstallments,
    revenueResult,
  ] = await Promise.all([
    prisma.enrollment.count(),
    prisma.enrollment.count({ where: { paymentStatus: 'pending' } }),
    prisma.enrollment.count({ where: { paymentStatus: 'succeeded' } }),
    prisma.studentUser.count(),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: 'new' } }),
    prisma.contactSubmission.count(),
    prisma.installmentSchedule.count({ where: { status: 'overdue' } }),
    prisma.installmentSchedule.count({
      where: {
        status: 'pending',
        dueDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // next 7 days
        },
      },
    }),
    prisma.installmentSchedule.aggregate({
      where: { status: 'paid' },
      _sum: { amount: true },
    }),
  ]);

  const revenueCollected = revenueResult._sum.amount ?? 0;

  // Monthly enrollment trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recentEnrollments = await prisma.enrollment.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true, amount: true, paymentStatus: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({
    enrollments: {
      total: totalEnrollments,
      pending: pendingEnrollments,
      succeeded: succeededEnrollments,
    },
    students: { total: totalStudents },
    leads: { total: totalLeads, new: newLeads },
    contacts: { total: totalContacts },
    installments: { overdue: overdueInstallments, upcomingWeek: upcomingInstallments },
    revenue: { collected: revenueCollected, currency: 'KES' },
    recentEnrollments,
  });
}
