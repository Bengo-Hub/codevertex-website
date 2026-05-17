import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const patchSchema = z.object({
  paymentStatus: z.enum(['pending', 'succeeded', 'failed', 'refunded']).optional(),
  paymentRef: z.string().optional(),
  cohortId: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: BigInt(id) },
    include: {
      studentUser: true,
      installments: { orderBy: { installmentNo: 'asc' } },
      cohort: true,
    },
  });
  if (!enrollment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    ...enrollment,
    id: enrollment.id.toString(),
    cohortId: enrollment.cohortId?.toString() ?? null,
    cohort: enrollment.cohort
      ? { ...enrollment.cohort, id: enrollment.cohort.id.toString() }
      : null,
    installments: enrollment.installments.map((i) => ({
      ...i,
      id: i.id.toString(),
      enrollmentId: i.enrollmentId.toString(),
    })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data = patchSchema.parse(body);

  const updated = await prisma.enrollment.update({
    where: { id: BigInt(id) },
    data: {
      ...(data.paymentStatus ? { paymentStatus: data.paymentStatus } : {}),
      ...(data.paymentRef !== undefined ? { paymentRef: data.paymentRef } : {}),
      ...(data.cohortId ? { cohortId: BigInt(data.cohortId) } : {}),
    },
  });

  return NextResponse.json({ ...updated, id: updated.id.toString() });
}
