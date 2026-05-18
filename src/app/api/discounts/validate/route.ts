// POST /api/discounts/validate — validates a discount code for a given course
// Returns discount info so the enrollment form can show the reduced price.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const schema = z.object({
  code: z.string().min(1),
  courseId: z.string().optional(),
  amount: z.number().int().optional(), // original full price for computing discounted price
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, courseId, amount } = schema.parse(body);

  const rule = await prisma.discountRule.findUnique({
    where: { code: code.toUpperCase() },
    include: { _count: { select: { enrollments: true } } },
  });

  if (!rule || !rule.active) {
    return NextResponse.json({ valid: false, error: 'Invalid or expired discount code' }, { status: 200 });
  }

  const now = new Date();
  if (rule.validFrom && now < rule.validFrom) {
    return NextResponse.json({ valid: false, error: 'Discount code is not yet active' });
  }
  if (rule.validUntil && now > rule.validUntil) {
    return NextResponse.json({ valid: false, error: 'Discount code has expired' });
  }
  if (rule.courseId && courseId && rule.courseId !== courseId) {
    return NextResponse.json({ valid: false, error: 'Discount code does not apply to this course' });
  }
  if (rule.maxUses != null && rule._count.enrollments >= rule.maxUses) {
    return NextResponse.json({ valid: false, error: 'Discount code has reached its usage limit' });
  }

  const remaining = rule.maxUses != null ? Math.max(0, rule.maxUses - rule._count.enrollments) : null;
  const discountedAmount =
    amount != null
      ? rule.discountPct != null
        ? Math.round(amount * (1 - rule.discountPct / 100))
        : rule.discountAmount != null
        ? Math.max(0, amount - rule.discountAmount)
        : amount
      : null;

  return NextResponse.json({
    valid: true,
    ruleId: rule.id.toString(),
    code: rule.code,
    name: rule.name,
    discountPct: rule.discountPct,
    discountAmount: rule.discountAmount,
    discountedAmount,
    remaining,
    remainingSlots: remaining,
  });
}
