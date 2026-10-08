import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getParentSession } from '@/lib/parent-access';
import { buildTreasuryPayUrl } from '@/lib/treasury-pay';

// Public site URL (not the request Host, which behind the ingress can be an internal name).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://codevertexafrica.com';

// POST /api/parent/pay  { enrollmentId, installmentNo? }
// Builds the hosted payment link for an unpaid installment (or the remaining balance of
// an upfront enrollment). Amounts always come from the DB, never from the browser, and
// only enrollments of the student bound to the parent session can be paid.
export async function POST(req: NextRequest) {
  const studentId = await getParentSession(req);
  if (!studentId) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const rawId = typeof body?.enrollmentId === 'string' ? body.enrollmentId : '';
  if (!/^\d+$/.test(rawId)) return NextResponse.json({ error: 'Invalid enrollment' }, { status: 400 });

  const enrollment = await prisma.enrollment.findFirst({
    where: { id: BigInt(rawId), studentUserId: studentId },
    select: {
      id: true, courseName: true, currency: true, amount: true, paymentStatus: true,
      installments: { where: { status: { not: 'paid' } }, orderBy: { installmentNo: 'asc' }, select: { installmentNo: true, amount: true } },
    },
  });
  if (!enrollment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const installmentNo = Number.isInteger(body?.installmentNo) ? body.installmentNo : null;
  const target = installmentNo
    ? enrollment.installments.find((i) => i.installmentNo === installmentNo)
    : enrollment.installments[0];

  let amount: number;
  let description: string;
  if (target) {
    amount = target.amount;
    description = `${enrollment.courseName} - Installment ${target.installmentNo}`;
  } else if (enrollment.installments.length === 0 && !['succeeded', 'paid'].includes(enrollment.paymentStatus)) {
    amount = enrollment.amount;
    description = enrollment.courseName;
  } else {
    return NextResponse.json({ error: 'Nothing is due for this enrollment.' }, { status: 400 });
  }

  return NextResponse.json({
    url: buildTreasuryPayUrl({
      amount,
      currency: enrollment.currency,
      referenceId: `DGT-${enrollment.id}-DGT-${studentId}`,
      description,
      redirectUrl: `${SITE_URL}/digitika/parent`,
      buttonText: 'Back to parent portal',
    }),
  });
}
