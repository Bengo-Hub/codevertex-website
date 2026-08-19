import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission, AUTH_API_URL } from '@/lib/auth/rbac';
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
 * DELETE /api/admin/users/{id} — removes the LOCAL SiteUser row (Digitika's own mirror
 * + panel-access grant). By default this does NOT delete the person's actual SSO
 * account — if they log in again, JIT re-creates this row with no Digitika role
 * assigned (a real removal from Digitika's roster, not a ban).
 *
 * Pass `?purge=true` to ALSO permanently delete their underlying SSO account platform-
 * wide via auth-api's real hard-delete (POST /api/v1/admin/users/{id}/purge) —
 * irreversible: sessions, tokens, MFA, tenant memberships, everything. auth-api then
 * emits `auth.user.deleted` so other services can remove their own shadow-user data too.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission(req, digitikaPerm('users', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  const user = await prisma.siteUser.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const purge = new URL(req.url).searchParams.get('purge') === 'true';
  if (purge) {
    const res = await fetch(`${AUTH_API_URL}/api/v1/admin/users/${id}/purge`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${guard.session.accessToken}` },
    });
    if (!res.ok && res.status !== 404) {
      const detail = await res.text().catch(() => '');
      return NextResponse.json(
        { error: `auth-api rejected the purge (${res.status}): ${detail || 'no detail'}` },
        { status: 502 }
      );
    }
  }

  await prisma.siteUser.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
