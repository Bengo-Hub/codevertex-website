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
  // The id comes straight from the authenticated student's own record
  // (StudentDashboard passes `data.student.id`), so it's already
  // correctly-cased — do NOT force-uppercase it here. Real prod ids are
  // "DGT-XXXXXXXX", but local/dev seed ids like "student-1" are lowercase;
  // uppercasing unconditionally broke lookups for those.
  const trimmed = studentId.trim();

  let student = await prisma.studentUser.findUnique({ where: { id: trimmed } });
  if (!student) {
    // Fall back to a case-insensitive lookup for the few places that still
    // pass user-typed input (e.g. an uppercase-normalized DGT- id).
    student = await prisma.studentUser.findFirst({
      where: { id: { equals: trimmed, mode: 'insensitive' } },
    });
  }
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }
  const id = student.id;

  let rule = await prisma.discountRule.findFirst({
    where: { referrerStudentId: id, isReferral: true },
  });

  if (!rule) {
    const code = `REF-${id.replace('DGT-', '')}`;
     rule = await prisma.discountRule.create({
      data: {
        name: `Referral â€” ${student.fullName}`,
        code,
        description: `Referral code for ${student.fullName} (${id})`,
        discountPct: 10, // default; admins can adjust in the Discounts panel like any other code
        isReferral: true,
        referrerStudentId: id,
        active: true,
        maxUses: 20, // default cap; admins can raise/remove it in the Discounts panel like any other code
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
