import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

const patchSchema = z.object({ pinned: z.boolean() });

// PATCH /api/admin/threads/[id] — pin/unpin a thread (surfaces common questions).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('classroom', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  const body = await req.json();
  const data = patchSchema.parse(body);

  const thread = await prisma.courseThread.update({ where: { id }, data: { pinned: data.pinned } });
  return NextResponse.json(thread);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('classroom', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  await prisma.courseThread.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
