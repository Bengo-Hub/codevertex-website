import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ADMIN_BYPASS_ROLES } from '@/lib/digitika-rbac-catalog';
import { extractProfileName, extractProfileAvatar } from '@/lib/auth/sso-profile';

export const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'https://sso.codevertexafrica.com';
const PLATFORM_TENANT_SLUG = 'codevertex';

let cachedPlatformTenantId: string | null = null;

/**
 * Resolves the codevertex platform-owner tenant's UUID via auth-api's public
 * by-slug lookup (no auth required) — never hardcode this UUID, per the platform's
 * tenant-UUID-drift lesson (auth-api generates it at runtime, per environment).
 * Cached in-process for the life of the pod since it never changes.
 */
export async function resolvePlatformTenantId(): Promise<string | null> {
  if (cachedPlatformTenantId) return cachedPlatformTenantId;
  try {
    const res = await fetch(`${AUTH_API_URL}/api/v1/tenants/by-slug/${PLATFORM_TENANT_SLUG}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const body = await res.json();
    const id = body?.id ?? body?.tenant_id ?? body?.tenant?.id ?? null;
    if (id) cachedPlatformTenantId = id;
    return id;
  } catch {
    return null;
  }
}

export interface DigitikaSession {
  userId: string;
  email: string;
  fullName: string | null;
  accessToken: string;
  /** SSO global admin/superuser/platform_admin/superadmin role, or is_platform_owner */
  isBypass: boolean;
  digitikaRoleCode: string | null;
  permissions: string[];
}

function extractBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

async function fetchSsoProfile(accessToken: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${AUTH_API_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Resolves the calling user's Digitika admin-panel session from their SSO bearer token:
 * verifies with auth-api, JIT-upserts the local SiteUser (self-healing on every call, per
 * the platform's "JIT must heal existing users" convention), and resolves local permissions.
 *
 * Permission ASSIGNMENT is primarily local (via the Users page → SiteUser.digitikaRoleCode),
 * but a global `digitika_admin`/`digitika_staff` role assigned through auth-ui/SSO tenant
 * membership is honored too when it maps to a role that actually exists locally.
 */
export async function resolveDigitikaSession(req: NextRequest): Promise<DigitikaSession | null> {
  const accessToken = extractBearerToken(req);
  if (!accessToken) return null;

  const profile = await fetchSsoProfile(accessToken);
  if (!profile) return null;

  const userId = String(profile.id ?? profile.sub ?? '');
  const email = String(profile.email ?? '');
  if (!userId || !email) return null;

  const globalRoles = Array.isArray(profile.roles) ? (profile.roles as string[]) : [];
  const isPlatformOwner = Boolean(profile.is_platform_owner);
  const isBypass = isPlatformOwner || globalRoles.some((r) => ADMIN_BYPASS_ROLES.has(r));

  const fullName = extractProfileName(profile.profile);
  const avatarUrl = extractProfileAvatar(profile.profile);
  const tenantId = (profile.tenant_id ?? profile.primary_tenant_id ?? null) as string | null;
  const tenantSlug = (profile.tenant_slug ?? null) as string | null;

  const siteUser = await prisma.siteUser.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email,
      fullName,
      avatarUrl,
      role: globalRoles[0] ?? 'member',
      tenantId,
      tenantSlug,
      lastLoginAt: new Date(),
    },
    update: {
      email,
      fullName: fullName ?? undefined,
      avatarUrl: avatarUrl ?? undefined,
      role: globalRoles[0] ?? undefined,
      tenantId: tenantId ?? undefined,
      tenantSlug: tenantSlug ?? undefined,
      lastLoginAt: new Date(),
    },
  });

  // A global role that happens to match a LOCALLY-KNOWN role code (assigned via
  // auth-ui/SSO tenant membership) heals the local assignment. Never assign a code
  // that doesn't exist in our own DigitikaRole table (avoids an FK error and avoids
  // trusting an unrelated global role name as if it were a Digitika role).
  const ssoCandidateCode = globalRoles.find((r) => r === 'digitika_admin' || r === 'digitika_staff') ?? null;
  let digitikaRoleCode = siteUser.digitikaRoleCode;

  if (ssoCandidateCode && ssoCandidateCode !== digitikaRoleCode) {
    const roleExists = await prisma.digitikaRole.findUnique({ where: { code: ssoCandidateCode } });
    if (roleExists) {
      digitikaRoleCode = ssoCandidateCode;
      await prisma.siteUser.update({ where: { id: userId }, data: { digitikaRoleCode } });
    }
  }

  let permissions: string[] = [];
  if (digitikaRoleCode) {
    const role = await prisma.digitikaRole.findUnique({
      where: { code: digitikaRoleCode },
      include: { permissions: { include: { permission: true } } },
    });
    permissions = role?.permissions.map((rp) => rp.permission.code) ?? [];
  }

  return { userId, email, fullName, accessToken, isBypass, digitikaRoleCode, permissions };
}

export function hasPermission(session: DigitikaSession | null, code: string): boolean {
  if (!session) return false;
  if (session.isBypass) return true;
  return session.permissions.includes(code);
}

export function canAccessAdminPanel(session: DigitikaSession | null): boolean {
  if (!session) return false;
  return session.isBypass || session.permissions.length > 0;
}

/**
 * Route-handler guard: resolves the session and checks a required permission code.
 * Usage: `const guard = await requirePermission(req, 'digitika.users.manage'); if ('response' in guard) return guard.response;`
 */
export async function requirePermission(
  req: NextRequest,
  code: string
): Promise<{ session: DigitikaSession } | { response: NextResponse }> {
  const session = await resolveDigitikaSession(req);
  if (!session) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!hasPermission(session, code)) {
    return { response: NextResponse.json({ error: 'Forbidden', permission: code }, { status: 403 }) };
  }
  return { session };
}

/**
 * Route-handler guard for role/permission ADMINISTRATION specifically (creating roles,
 * editing a role's permission matrix, deleting a role). Deliberately hardcoded to the
 * `digitika_admin` role code rather than the generic `digitika.roles.manage` permission —
 * that permission is itself one of the checkboxes any custom role's matrix can grant, so
 * gating self-service RBAC changes on it would let a misconfigured custom role edit (and
 * potentially escalate) roles, including its own. Only Digitika Admin — or a full SSO
 * bypass — may ever mutate roles/permissions.
 */
export async function requireDigitikaAdmin(
  req: NextRequest
): Promise<{ session: DigitikaSession } | { response: NextResponse }> {
  const session = await resolveDigitikaSession(req);
  if (!session) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!session.isBypass && session.digitikaRoleCode !== 'digitika_admin') {
    return { response: NextResponse.json({ error: 'Forbidden', reason: 'Only Digitika Admin can manage roles/permissions' }, { status: 403 }) };
  }
  return { session };
}
