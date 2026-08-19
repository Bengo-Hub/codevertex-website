import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission, requireDigitikaAdmin } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('roles', 'view'));
  if ('response' in guard) return guard.response;

  const roles = await prisma.digitikaRole.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });

  return NextResponse.json({
    roles: roles.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      memberCount: r._count.users,
      permissionCodes: r.permissions.map((rp) => rp.permission.code),
      createdAt: r.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireDigitikaAdmin(req);
  if ('response' in guard) return guard.response;

  let body: { code?: string; name?: string; description?: string; permissionCodes?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const code = body.code?.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');
  const name = body.name?.trim();
  if (!code || !name) {
    return NextResponse.json({ error: 'code and name are required' }, { status: 400 });
  }

  const existing = await prisma.digitikaRole.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: `Role code "${code}" already exists` }, { status: 409 });
  }

  const permissionCodes = Array.isArray(body.permissionCodes) ? body.permissionCodes : [];
  const perms = permissionCodes.length
    ? await prisma.digitikaPermission.findMany({ where: { code: { in: permissionCodes } } })
    : [];

  const role = await prisma.digitikaRole.create({
    data: {
      code,
      name,
      description: body.description?.trim() || null,
      isSystem: false,
      permissions: { create: perms.map((p) => ({ permissionId: p.id })) },
    },
  });

  return NextResponse.json({ id: role.id, code: role.code }, { status: 201 });
}
