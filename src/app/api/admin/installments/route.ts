import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { loadReminderRow, remindInstallment } from '@/lib/installment-reminders';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'paid', 'overdue', 'reminded']).optional(),
  paymentRef: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('installments', 'view'));
  if ('response' in guard) return guard.response;

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
  const guard = await requirePermission(req, digitikaPerm('installments', 'manage'));
  if ('response' in guard) return guard.response;

  // Manually send a payment reminder for a specific installment
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (action !== 'send-reminder') {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  const { installmentId } = z.object({ installmentId: z.string().regex(/^\d+$/) }).parse(await req.json());
  const installment = await loadReminderRow(BigInt(installmentId));
  if (!installment) {
    return NextResponse.json({ error: 'Installment not found' }, { status: 404 });
  }
  if (!(await remindInstallment(installment))) {
    return NextResponse.json({ error: 'The reminder could not be sent right now. Try again shortly.' }, { status: 502 });
  }
  return NextResponse.json({ success: true });
}
