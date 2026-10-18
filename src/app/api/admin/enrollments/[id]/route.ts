import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';
import { summarizeEnrollmentPayments } from '@/lib/installments';

const patchSchema = z.object({
  paymentStatus: z.enum(['pending', 'succeeded', 'failed', 'refunded']).optional(), // only pending/failed are accepted; see PATCH
  paymentRef: z.string().optional(),
  cohortId: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('enrollments', 'view'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: BigInt(id) },
    include: {
      studentUser: true,
      installments: { orderBy: { installmentNo: 'asc' } },
      cohort: true,
    },
  });
  if (!enrollment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    ...enrollment,
    id: enrollment.id.toString(),
    cohortId: enrollment.cohortId?.toString() ?? null,
    cohort: enrollment.cohort
      ? { ...enrollment.cohort, id: enrollment.cohort.id.toString() }
      : null,
    installments: enrollment.installments.map((i) => ({
      ...i,
      id: i.id.toString(),
      enrollmentId: i.enrollmentId.toString(),
    })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('enrollments', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid update' }, { status: 400 });
  }
  const data = parsed.data;

  if (data.paymentStatus !== undefined) {
    // The payment status follows the money, so it is never typed in. "succeeded" comes from a
    // payment (online, or Record payment, which books treasury); "refunded" from a treasury
    // refund. Without this an admin could mark an enrollment paid with nothing in the books,
    // or hide real payments by setting it back to pending. An enrollment with no money
    // received can still be marked pending or failed (an abandoned checkout).
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: BigInt(id) },
      include: { installments: { select: { installmentNo: true, amount: true, dueDate: true, status: true } } },
    });
    if (!enrollment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { amountPaid } = summarizeEnrollmentPayments(enrollment, enrollment.installments);
    if (data.paymentStatus === 'succeeded' || data.paymentStatus === 'refunded') {
      return NextResponse.json(
        {
          error: data.paymentStatus === 'succeeded'
            ? 'Use Record payment to mark an enrollment paid, so treasury has the money too.'
            : 'Refunds are made in treasury; the enrollment is updated from there.',
        },
        { status: 409 },
      );
    }
    if (amountPaid > 0) {
      return NextResponse.json(
        { error: `${enrollment.currency} ${amountPaid.toLocaleString()} has been received on this enrollment, so its status follows the payments.` },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.enrollment.update({
    where: { id: BigInt(id) },
    data: {
      ...(data.paymentStatus ? { paymentStatus: data.paymentStatus } : {}),
      ...(data.paymentRef !== undefined ? { paymentRef: data.paymentRef } : {}),
      ...(data.cohortId ? { cohortId: BigInt(data.cohortId) } : {}),
    },
  });

  return NextResponse.json({ ...updated, id: updated.id.toString() });
}

/**
 * Deletes an enrollment made by mistake. Only while no money has been received on it: payment
 * history is never erased, so an enrollment with payments is refunded in treasury instead.
 * Its unpaid installment schedule goes with it (cascade).
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission(req, digitikaPerm('enrollments', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: BigInt(id) },
    include: { installments: { select: { installmentNo: true, amount: true, dueDate: true, status: true } } },
  });
  if (!enrollment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { amountPaid } = summarizeEnrollmentPayments(enrollment, enrollment.installments);
  if (amountPaid > 0) {
    return NextResponse.json(
      { error: `${enrollment.currency} ${amountPaid.toLocaleString()} has been received on this enrollment. Refund it in treasury; it cannot be deleted.` },
      { status: 409 },
    );
  }
  await prisma.installmentSchedule.deleteMany({ where: { enrollmentId: enrollment.id } });
  await prisma.enrollment.delete({ where: { id: enrollment.id } });
  return NextResponse.json({ success: true });
}
