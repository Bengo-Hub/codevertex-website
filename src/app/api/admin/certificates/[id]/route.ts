import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

const patchSchema = z.object({ revoked: z.boolean() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('certificates', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  const { revoked } = patchSchema.parse(await req.json());

  const cert = await prisma.certificate.update({ where: { id }, data: { revoked } });
  return NextResponse.json(cert);
}
