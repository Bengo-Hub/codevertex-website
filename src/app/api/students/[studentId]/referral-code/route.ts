import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/students/[studentId]/referral-code
//
// Returns the student's existing referral code, creating one on first
// request. Referral codes are plain DiscountRule rows (isReferral: true,
// referrerStudentId set) so they redeem through the exact same
// /api/discounts/validate + enrollment flow every other promo code uses —
// no new checkout logic needed.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const id = studentId.trim().toUpperCase();

  const student = await prisma.studentUser.findUnique({ where: { id } });
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  let rule = await prisma.discountRule.findFirst({
    where: { referrerStudentId: id, isReferral: true },
  });

  if (!rule) {
    const code = `REF-${id.replace('DGT-', '')}`;
    rule = await prisma.discountRule.create({
      data: {
        name: `Referral — ${student.fullName}`,
        code,
        description: `Referral code for ${student.fullName} (${id})`,
        discountPct: 10, // default; admins can adjust in the Discounts panel like any other code
        isReferral: true,
        referrerStudentId: id,
        active: true,
      },
    });
  }

  return NextResponse.json({
    code: rule.code,
    discountPct: rule.discountPct,
    usedCount: rule.usedCount,
    active: rule.active,
  });
}
