import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { summarizeEnrollmentPayments } from '@/lib/enrollment-helpers';

// GET /api/enrollments/[id]/summary?reference=DGT-{id}-DGT-{studentId}
// Receipt / "my enrollment" summary. Public (no login) by design, so the caller must
// present the full payment reference from the receipt email or redirect, not just the
// sequential enrollment id; otherwise anyone could walk ids and read other students'
// names, emails and payments.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const reference = req.nextUrl.searchParams.get('reference') ?? '';
    const match = reference.match(/^DGT-(\d+)-DGT-([A-Za-z0-9-]+)$/);
    if (!match || match[1] !== id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { id: BigInt(id), studentUserId: match[2] },
      include: {
        installments: { orderBy: { installmentNo: 'asc' } },
        studentUser: { select: { id: true } },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { totalAmount, amountPaid, remainingBalance } = summarizeEnrollmentPayments(enrollment, enrollment.installments);

    return NextResponse.json({
      enrollmentId: enrollment.id.toString(),
      studentId: enrollment.studentUser?.id ?? '',
      courseName: enrollment.courseName,
      category: enrollment.category,
      fullName: enrollment.fullName,
      email: enrollment.email,
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
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
