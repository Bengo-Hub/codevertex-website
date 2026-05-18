// Admin CRUD for discount rules — List + Create
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).toUpperCase(),
  description: z.string().optional(),
  discountPct: z.number().int().min(1).max(100).optional(),
  discountAmount: z.number().int().min(1).optional(),
  courseId: z.string().optional(),
  maxUses: z.number().int().min(1).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  active: z.boolean().default(true),
}).refine((d) => d.discountPct != null || d.discountAmount != null, {
  message: 'Either discountPct or discountAmount is required',
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20'));
  const activeOnly = url.searchParams.get('active') === 'true';

  const where = activeOnly ? { active: true } : {};
  const [total, rules] = await Promise.all([
    prisma.discountRule.count({ where }),
    prisma.discountRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { enrollments: true } } },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pages: Math.ceil(total / limit),
    rules: rules.map((r) => ({
      ...r,
      id: r.id.toString(),
      usedCount: r._count.enrollments,
      remaining: r.maxUses != null ? Math.max(0, r.maxUses - r._count.enrollments) : null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = createSchema.parse(body);

  const rule = await prisma.discountRule.create({
    data: {
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description,
      discountPct: data.discountPct,
      discountAmount: data.discountAmount,
      courseId: data.courseId,
      maxUses: data.maxUses,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      active: data.active,
    },
  });

  return NextResponse.json({ ...rule, id: rule.id.toString() }, { status: 201 });
}
