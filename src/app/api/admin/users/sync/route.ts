/**
 * POST /api/admin/users/sync
 *
 * Pulls the full platform user roster from auth-api (`GET /api/v1/admin/users`) and
 * upserts it into the local SiteUser table, so a Digitika admin can grant panel access
 * to a platform user who has never logged into codevertex-website before.
 *
 * auth-api's admin user-list endpoint is Bearer-JWT-gated on `is_platform_owner`
 * (there is no S2S-key path for it) — so this forwards the CALLING admin's own access
 * token, the same one already used to resolve their session. Since "Digitika platform
 * admins/staff" are by definition members of the `codevertex` tenant, they carry
 * `is_platform_owner: true` and this call succeeds for them.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'https://sso.codevertexafrica.com';
const PAGE_LIMIT = 100;
const MAX_PAGES = 50; // safety bound — 5,000 users

interface AuthApiUser {
  id: string;
  email: string;
  primary_tenant_id?: string | null;
  profile?: { full_name?: string; fullName?: string; avatar_url?: string; phone?: string } | null;
  last_login_at?: string | null;
  memberships?: { tenant_id: string; roles: string[]; status: string }[];
}

function extractUserList(body: unknown): AuthApiUser[] {
  if (Array.isArray(body)) return body as AuthApiUser[];
  const obj = body as Record<string, unknown>;
  const candidate = obj?.data ?? obj?.users ?? obj?.items ?? obj?.results;
  return Array.isArray(candidate) ? (candidate as AuthApiUser[]) : [];
}

function rolesFor(user: AuthApiUser): string[] {
  const memberships = user.memberships ?? [];
  const primary = memberships.find((m) => m.tenant_id === user.primary_tenant_id);
  return primary?.roles ?? memberships[0]?.roles ?? [];
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('users', 'manage'));
  if ('response' in guard) return guard.response;
  const { accessToken } = guard.session;

  let created = 0;
  let updated = 0;
  let page = 1;

  for (; page <= MAX_PAGES; page++) {
    const url = new URL('/api/v1/admin/users', AUTH_API_URL);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(PAGE_LIMIT));

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      if (page === 1) {
        const detail = res.status === 403
          ? 'Your account is not recognized as a platform owner by auth-api — only Codevertex platform staff can sync the user roster.'
          : `auth-api responded ${res.status}`;
        return NextResponse.json({ error: `Failed to sync users: ${detail}` }, { status: 502 });
      }
      break; // partial sync already committed for earlier pages — stop cleanly
    }

    const body = await res.json().catch(() => null);
    const users = extractUserList(body);
    if (users.length === 0) break;

    for (const u of users) {
      if (!u.id || !u.email) continue;
      const roles = rolesFor(u);
      const existing = await prisma.siteUser.findUnique({ where: { id: u.id } });
      await prisma.siteUser.upsert({
        where: { id: u.id },
        create: {
          id: u.id,
          email: u.email,
          fullName: u.profile?.full_name ?? u.profile?.fullName ?? null,
          avatarUrl: u.profile?.avatar_url ?? null,
          role: roles[0] ?? 'member',
          tenantId: u.primary_tenant_id ?? null,
          lastLoginAt: u.last_login_at ? new Date(u.last_login_at) : null,
          syncedFromSso: true,
        },
        update: {
          email: u.email,
          fullName: u.profile?.full_name ?? u.profile?.fullName ?? undefined,
          avatarUrl: u.profile?.avatar_url ?? undefined,
          role: roles[0] ?? undefined,
          tenantId: u.primary_tenant_id ?? undefined,
          lastLoginAt: u.last_login_at ? new Date(u.last_login_at) : undefined,
        },
      });
      if (existing) updated++;
      else created++;
    }

    if (users.length < PAGE_LIMIT) break; // last page
  }

  return NextResponse.json({ ok: true, created, updated, pagesFetched: page });
}
