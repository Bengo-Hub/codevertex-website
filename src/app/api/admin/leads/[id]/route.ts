import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

const patchSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('leads', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  const body = await req.json();
  const data = patchSchema.parse(body);

  const updated = await prisma.lead.update({
    where: { id: BigInt(id) },
    data,
  });

  return NextResponse.json({ ...updated, id: updated.id.toString() });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('leads', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  await prisma.lead.delete({ where: { id: BigInt(id) } });
  return NextResponse.json({ success: true });
}
