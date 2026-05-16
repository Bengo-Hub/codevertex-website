import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const patchSchema = z.object({
  name: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  maxSlots: z.number().optional(),
  status: z.enum(['open', 'full', 'closed', 'completed']).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data = patchSchema.parse(body);

  const updated = await prisma.cohort.update({
    where: { id: BigInt(id) },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
      ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
      ...(data.maxSlots !== undefined ? { maxSlots: data.maxSlots } : {}),
      ...(data.status ? { status: data.status } : {}),
    },
  });

  return NextResponse.json({ ...updated, id: updated.id.toString() });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.cohort.delete({ where: { id: BigInt(id) } });
  return NextResponse.json({ success: true });
}
