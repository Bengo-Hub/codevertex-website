// POST /api/enrollments/[id]/sync
// Called by the success page when Paystack redirects with ?payment=succeeded.
// Updates the local Prisma DB to reflect the payment — used as a fallback when
// the NATS treasury subscriber hasn't processed the event yet.
// Body: { paymentRef?: string, amount?: number, currency?: string }

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const bodySchema = z.object({
  paymentRef: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const enrollmentId = BigInt(id);

    const body = await req.json().catch(() => ({}));
    const { paymentRef, amount } = bodySchema.parse(body);

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { installments: { orderBy: { installmentNo: 'asc' } } },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Idempotency: already succeeded
    if (enrollment.paymentStatus === 'succeeded') {
      return NextResponse.json({ synced: false, reason: 'already_succeeded' });
    }

    const unpaidInsts = enrollment.installments.filter((i) => i.status !== 'paid');
    const nextInst = unpaidInsts[0];

    if (nextInst) {
      const paidAmount = amount ?? nextInst.amount;
      await prisma.installmentSchedule.update({
        where: { id: nextInst.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
          paymentRef: paymentRef ?? null,
          amount: paidAmount > 0 ? paidAmount : nextInst.amount,
        },
      });
    }

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        paymentStatus: 'succeeded',
        paymentRef: paymentRef ?? null,
        notifiedAt: new Date(),
      },
    });

    return NextResponse.json({ synced: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error('[enrollment-sync]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
