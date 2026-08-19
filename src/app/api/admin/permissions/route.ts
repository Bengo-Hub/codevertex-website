import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { DIGITIKA_MODULES, digitikaPerm } from '@/lib/digitika-rbac-catalog';

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('roles', 'view'));
  if ('response' in guard) return guard.response;

  const permissions = await prisma.digitikaPermission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] });

  const groups = DIGITIKA_MODULES.map((mod) => ({
    module: mod.key,
    label: mod.label,
    permissions: permissions.filter((p) => p.module === mod.key),
  })).filter((g) => g.permissions.length > 0);

  return NextResponse.json({ groups });
}
