import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission(req, digitikaPerm('users', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  let body: { digitikaRoleCode?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.digitikaRoleCode === undefined) {
    return NextResponse.json({ error: 'digitikaRoleCode is required (or null to revoke access)' }, { status: 400 });
  }

  const user = await prisma.siteUser.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (body.digitikaRoleCode !== null) {
    const role = await prisma.digitikaRole.findUnique({ where: { code: body.digitikaRoleCode } });
    if (!role) return NextResponse.json({ error: `Unknown role code "${body.digitikaRoleCode}"` }, { status: 400 });
  }

  const updated = await prisma.siteUser.update({
    where: { id },
    data: { digitikaRoleCode: body.digitikaRoleCode },
    include: { digitikaRole: { select: { code: true, name: true } } },
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/admin/users/{id} — hard-deletes the LOCAL SiteUser row (Digitika's own
 * mirror + panel-access grant). This does NOT delete the person's actual SSO account —
 * auth-api has no hard-delete for that (AdminDeleteUser there only sets status="deleted",
 * a soft delete, and the record stays a member of whatever other tenants they belong to).
 * If the user still authenticates via SSO afterwards, JIT re-creates this row with no
 * Digitika role assigned — i.e. this is a real removal from Digitika's roster, not a ban.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission(req, digitikaPerm('users', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  const user = await prisma.siteUser.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await prisma.siteUser.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
