import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const enrollmentId = BigInt(id);

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        installments: { orderBy: { installmentNo: 'asc' } },
        studentUser: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const totalAmount = enrollment.totalAmount ?? enrollment.amount;
    const amountPaid = enrollment.installments.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
      || (enrollment.paymentStatus === 'succeeded' ? enrollment.amount : 0);
    const remainingBalance = Math.max(0, totalAmount - amountPaid);

    return NextResponse.json({
      enrollmentId: enrollment.id.toString(),
      studentId: enrollment.studentUser?.id ?? '',
      courseName: enrollment.courseName,
      category: enrollment.category,
      fullName: enrollment.fullName,
      paymentPlan: enrollment.paymentPlan ?? 'upfront',
      firstPaymentAmount: enrollment.amount,
      totalAmount,
      amountPaid,
      remainingBalance,
      currency: enrollment.currency,
      paymentStatus: enrollment.paymentStatus,
      createdAt: enrollment.createdAt.toISOString(),
      installments: enrollment.installments.map((i) => ({
        installmentNo: i.installmentNo,
        amount: i.amount,
        dueDate: i.dueDate.toISOString(),
        status: i.status,
        label: `Installment ${i.installmentNo}`,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
