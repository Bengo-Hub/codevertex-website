import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Treasury sends: POST /api/webhooks/treasury
// Payload: { event, reference_id, reference_type, payment_ref, status, amount, currency }
// reference_id format: DGT-{enrollmentId}-{studentId}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-treasury-signature') ?? '';
    const body = await req.json();

    const { event, reference_id, reference_type, payment_ref, status, amount } = body;

    // Only handle Digitika enrollment payments
    if (reference_type !== 'digitika_enrollment') {
      return NextResponse.json({ received: true });
    }

    if (event !== 'payment.succeeded' && status !== 'succeeded') {
      return NextResponse.json({ received: true });
    }

    // Parse enrollment ID from reference: DGT-{enrollmentId}-DGT-{studentSuffix}
    const match = (reference_id as string)?.match(/^DGT-(\d+)-DGT-/);
    if (!match) {
      console.error('[treasury-webhook] unrecognised reference_id:', reference_id);
      return NextResponse.json({ received: true });
    }

    const enrollmentId = BigInt(match[1]);

    // Update the enrollment payment status
    const enrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        paymentStatus: 'succeeded',
        paymentRef: payment_ref ?? null,
        notifiedAt: new Date(),
      },
      include: { installments: true },
    });

    // Mark installment 1 as paid
    const inst1 = enrollment.installments.find((i) => i.installmentNo === 1);
    if (inst1) {
      await prisma.installmentSchedule.update({
        where: { id: inst1.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
          paymentRef: payment_ref ?? null,
        },
      });
    }

    console.info(
      `[treasury-webhook] enrollment ${enrollmentId} marked succeeded, ref=${payment_ref}`
    );

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[treasury-webhook]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
