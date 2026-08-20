import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  type: z.enum(['VIDEO', 'TEXT', 'QUIZ', 'RESOURCE']).optional(),
  content: z.string().optional(),
  videoUrl: z.string().optional(),
  durationSec: z.number().int().optional(),
  resourceUrl: z.string().optional(),
  resourceName: z.string().optional(),
  isPreview: z.boolean().optional(),
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

  const lesson = await prisma.lesson.update({ where: { id }, data });
  return NextResponse.json(lesson);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('content', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  await prisma.lesson.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
