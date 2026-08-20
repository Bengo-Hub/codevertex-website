import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('content', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  const body = await req.json();
  const data = updateSchema.parse(body);

  const courseModule = await prisma.courseModule.update({ where: { id }, data });
  return NextResponse.json(courseModule);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('content', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  // Cascades to lessons → progress/quiz via onDelete: Cascade in schema.
  await prisma.courseModule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
