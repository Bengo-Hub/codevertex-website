import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendInstallmentReceipt, buildPortalLink } from '@/lib/notifications';

// Treasury sends: POST /api/webhooks/treasury
// Payload: { event, reference_id, reference_type, payment_ref, status, amount, currency }
// reference_id format: DGT-{enrollmentId}-DGT-{studentId}

export async function POST(req: NextRequest) {
  try {
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
    const paidAmount: number = typeof amount === 'number' ? amount : 0;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { installments: { orderBy: { installmentNo: 'asc' } } },
    });

    if (!enrollment) {
      console.error('[treasury-webhook] enrollment not found:', enrollmentId);
      return NextResponse.json({ received: true });
    }

    // Find the next unpaid installment
    const unpaidInsts = enrollment.installments.filter((i) => i.status !== 'paid');
    const nextInst = unpaidInsts[0];

    // Mark the next installment as paid with the actual paid amount
    if (nextInst) {
      await prisma.installmentSchedule.update({
        where: { id: nextInst.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
          paymentRef: payment_ref ?? null,
          amount: paidAmount > 0 ? paidAmount : nextInst.amount,
        },
      });

      // Overpayment: if paid more than scheduled, recalculate remaining installments
      if (paidAmount > 0 && paidAmount > nextInst.amount && unpaidInsts.length > 1) {
        const totalPaidSoFar =
          enrollment.installments.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0) +
          paidAmount;
        const totalAmount = enrollment.totalAmount ?? enrollment.amount;
        const remainingBalance = Math.max(0, totalAmount - totalPaidSoFar);
        const remainingInsts = unpaidInsts.slice(1); // excludes the one just paid

        if (remainingInsts.length > 0 && remainingBalance > 0) {
          const perInst = Math.ceil(remainingBalance / remainingInsts.length);
          for (let i = 0; i < remainingInsts.length; i++) {
            const isLast = i === remainingInsts.length - 1;
            const newAmount = isLast
              ? remainingBalance - perInst * (remainingInsts.length - 1)
              : perInst;
            await prisma.installmentSchedule.update({
              where: { id: remainingInsts[i].id },
              data: { amount: newAmount },
            });
          }
          console.info(
            `[treasury-webhook] overpayment detected — recalculated ${remainingInsts.length} remaining installments (balance=${remainingBalance})`
          );
        } else if (remainingBalance <= 0) {
          // Overpaid entire balance — mark all remaining as paid
          await prisma.installmentSchedule.updateMany({
            where: { enrollmentId, status: { not: 'paid' } },
            data: { status: 'paid', paidAt: new Date(), paymentRef: payment_ref ?? null },
          });
        }
      }
    }

    // Update enrollment payment status
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        paymentStatus: 'succeeded',
        paymentRef: payment_ref ?? null,
        notifiedAt: new Date(),
      },
      include: {
        installments: { orderBy: { installmentNo: 'asc' } },
        studentUser: true,
      },
    });

    // Send payment receipt email (fire and forget)
    if (nextInst && updatedEnrollment.studentUser) {
      const remaining = updatedEnrollment.installments.filter((i) => i.status !== 'paid');
      const nextUnpaid = remaining[0];
      const totalAmount = updatedEnrollment.totalAmount ?? updatedEnrollment.amount;
      const totalPaid = updatedEnrollment.installments
        .filter((i) => i.status === 'paid')
        .reduce((s, i) => s + i.amount, 0);
      const studentId = updatedEnrollment.studentUser.id;

      sendInstallmentReceipt({
        studentName: updatedEnrollment.fullName,
        studentEmail: updatedEnrollment.email,
        courseName: updatedEnrollment.courseName,
        installmentNo: nextInst.installmentNo,
        totalInstallments: updatedEnrollment.installments.length,
        amountPaid: paidAmount > 0 ? paidAmount : nextInst.amount,
        currency: updatedEnrollment.currency,
        paymentRef: payment_ref ?? undefined,
        studentId,
        enrollmentId: enrollmentId.toString(),
        remainingBalance: Math.max(0, totalAmount - totalPaid),
        nextInstallmentDate: nextUnpaid ? nextUnpaid.dueDate.toISOString().split('T')[0] : undefined,
        nextInstallmentAmount: nextUnpaid ? nextUnpaid.amount : undefined,
        portalLink: buildPortalLink(enrollmentId, studentId),
      }).catch((err) => console.error('[treasury-webhook] receipt email error:', err));
    }

    console.info(
      `[treasury-webhook] enrollment ${enrollmentId} marked succeeded, ref=${payment_ref}, amount=${paidAmount}`
    );

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[treasury-webhook]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
