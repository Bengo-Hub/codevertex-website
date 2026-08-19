import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireDigitikaAdmin } from '@/lib/auth/rbac';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireDigitikaAdmin(req);
  if ('response' in guard) return guard.response;

  const { id } = await params;
  const role = await prisma.digitikaRole.findUnique({ where: { id } });
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

  let body: { name?: string; description?: string; permissionCodes?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (role.isSystem && (body.name !== undefined || body.description !== undefined)) {
    return NextResponse.json({ error: 'System role name/description cannot be changed' }, { status: 403 });
  }

  if (body.permissionCodes !== undefined) {
    if (role.code === 'digitika_admin') {
      return NextResponse.json({ error: 'Digitika Admin always carries every permission and cannot be edited' }, { status: 403 });
    }
    const perms = await prisma.digitikaPermission.findMany({ where: { code: { in: body.permissionCodes } } });
    await prisma.digitikaRolePermission.deleteMany({ where: { roleId: id } });
    await prisma.digitikaRolePermission.createMany({
      data: perms.map((p) => ({ roleId: id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }

  if (!role.isSystem && (body.name !== undefined || body.description !== undefined)) {
    await prisma.digitikaRole.update({
      where: { id },
      data: {
        name: body.name?.trim() || undefined,
        description: body.description?.trim() ?? undefined,
      },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireDigitikaAdmin(req);
  if ('response' in guard) return guard.response;

  const { id } = await params;
  const role = await prisma.digitikaRole.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

  if (role.isSystem) {
    return NextResponse.json({ error: 'System roles cannot be deleted' }, { status: 403 });
  }
  if (role._count.users > 0) {
    return NextResponse.json(
      { error: `${role._count.users} user(s) still have this role assigned — reassign them first` },
      { status: 409 }
    );
  }

  await prisma.digitikaRole.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
