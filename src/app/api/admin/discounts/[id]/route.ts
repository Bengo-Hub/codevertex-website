// Admin CRUD for discount rules — Update + Delete
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  discountPct: z.number().int().min(1).max(100).optional(),
  discountAmount: z.number().int().min(1).optional(),
  courseId: z.string().nullable().optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  validFrom: z.string().datetime().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data = patchSchema.parse(body);

  const rule = await prisma.discountRule.update({
    where: { id: BigInt(params.id) },
    data: {
      ...data,
      validFrom: data.validFrom === null ? null : data.validFrom ? new Date(data.validFrom) : undefined,
      validUntil: data.validUntil === null ? null : data.validUntil ? new Date(data.validUntil) : undefined,
    },
  });

  return NextResponse.json({ ...rule, id: rule.id.toString() });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.discountRule.findUnique({
    where: { id: BigInt(params.id) },
    include: { _count: { select: { enrollments: true } } },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing._count.enrollments > 0) {
    // Deactivate instead of hard-delete to preserve enrollment history
    await prisma.discountRule.update({
      where: { id: BigInt(params.id) },
      data: { active: false },
    });
    return NextResponse.json({ deactivated: true });
  }
  await prisma.discountRule.delete({ where: { id: BigInt(params.id) } });
  return NextResponse.json({ deleted: true });
}
