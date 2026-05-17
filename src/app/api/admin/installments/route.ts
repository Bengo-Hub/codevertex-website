import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendInstallmentReminder } from '@/lib/notifications';

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'paid', 'overdue', 'reminded']).optional(),
  paymentRef: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10));
  const status = url.searchParams.get('status') ?? undefined;
  const daysAhead = parseInt(url.searchParams.get('daysAhead') ?? '30', 10);

  const cutoff = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

  const where = {
    ...(status ? { status } : { status: { not: 'paid' } }),
    dueDate: { lte: cutoff },
  };

  const [total, items] = await Promise.all([
    prisma.installmentSchedule.count({ where }),
    prisma.installmentSchedule.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        enrollment: {
          select: {
            id: true,
            fullName: true,
            email: true,
            courseName: true,
            studentUserId: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pages: Math.ceil(total / limit),
    items: items.map((i) => ({
      ...i,
      id: i.id.toString(),
      enrollmentId: i.enrollmentId.toString(),
      enrollment: { ...i.enrollment, id: i.enrollment.id.toString() },
    })),
  });
}

export async function POST(req: NextRequest) {
  // Manually send a payment reminder for a specific installment
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (action !== 'send-reminder') {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  const body = await req.json();
  const { installmentId } = z.object({ installmentId: z.string() }).parse(body);

  const installment = await prisma.installmentSchedule.findUnique({
    where: { id: BigInt(installmentId) },
    include: {
      enrollment: {
        select: {
          id: true,
          fullName: true,
          email: true,
          courseName: true,
          paymentPlan: true,
          studentUserId: true,
          installments: { select: { installmentNo: true } },
        },
      },
    },
  });

  if (!installment) {
    return NextResponse.json({ error: 'Installment not found' }, { status: 404 });
  }

  const { enrollment } = installment;
  const totalInstallments = enrollment.installments.length;
  const daysUntilDue = Math.ceil(
    (installment.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

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
    portalLink: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://codevertexitsolutions.com'}/digitika/success?reference=DGT-${enrollment.id}-DGT-${enrollment.studentUserId ?? ''}`,
  });

  await prisma.installmentSchedule.update({
    where: { id: installment.id },
    data: { reminderSentAt: new Date(), status: 'reminded' },
  });

  return NextResponse.json({ success: true });
}
