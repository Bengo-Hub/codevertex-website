import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const installmentPaymentSchema = z.object({
  amount: z.number(),
  label: z.string(),
});

const installmentPlanSchema = z.object({
  label: z.string(),
  payments: z.array(installmentPaymentSchema),
  totalAmount: z.number(),
  badge: z.string().optional(),
});

const patchSchema = z.object({
  name: z.string().optional(),
  shortName: z.string().nullish(),
  price: z.number().optional(),
  description: z.string().optional(),
  longDescription: z.string().nullish(),
  duration: z.string().optional(),
  mode: z.string().optional(),
  audience: z.string().nullish(),
  level: z.string().optional(),
  stack: z.string().nullish(),
  outcomes: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  careerPaths: z.array(z.string()).optional(),
  includes: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  installmentsEnabled: z.boolean().optional(),
  installmentPlans: z.array(installmentPlanSchema).optional(),
  sortOrder: z.number().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(course);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data = patchSchema.parse(body);

  const updated = await prisma.course.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Soft-delete by setting isActive = false
  const updated = await prisma.course.update({
    where: { id },
    data: { isActive: false },
  });
  return NextResponse.json(updated);
}
