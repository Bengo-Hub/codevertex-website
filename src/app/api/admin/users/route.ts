import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission, resolvePlatformTenantId, AUTH_API_URL } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('users', 'view'));
  if ('response' in guard) return guard.response;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '25', 10));
  const search = url.searchParams.get('search') ?? undefined;

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { fullName: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [total, items] = await Promise.all([
    prisma.siteUser.count({ where }),
    prisma.siteUser.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { digitikaRole: { select: { code: true, name: true } } },
    }),
  ]);

  return NextResponse.json({ total, page, pages: Math.ceil(total / limit), items });
}

interface CreateUserBody {
  email?: string;
  fullName?: string;
  phone?: string;
  digitikaRoleCode?: string;
}

/**
 * POST /api/admin/users — creates a BRAND NEW platform user (or adds an existing
 * global SSO account to the codevertex tenant) via auth-api's S2S tenant-members
 * endpoint, so the resulting SiteUser row is correctly keyed by the real global SSO
 * user id from day one (never a locally-generated id).
 */
export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('users', 'manage'));
  if ('response' in guard) return guard.response;

  let body: CreateUserBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }
  if (!body.digitikaRoleCode) {
    return NextResponse.json({ error: 'A Digitika role is required' }, { status: 400 });
  }

  const role = await prisma.digitikaRole.findUnique({ where: { code: body.digitikaRoleCode } });
  if (!role) {
    return NextResponse.json({ error: `Unknown role code "${body.digitikaRoleCode}"` }, { status: 400 });
  }

  const internalKey = process.env.INTERNAL_SERVICE_KEY;
  if (!internalKey) {
    return NextResponse.json({ error: 'Server is not configured with INTERNAL_SERVICE_KEY' }, { status: 500 });
  }

  const platformTenantId = await resolvePlatformTenantId();
  if (!platformTenantId) {
    return NextResponse.json({ error: 'Could not resolve the codevertex platform tenant from auth-api' }, { status: 502 });
  }

  const authRes = await fetch(`${AUTH_API_URL}/api/v1/s2s/tenants/${platformTenantId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': internalKey },
    body: JSON.stringify({
      email,
      roles: [body.digitikaRoleCode],
      name: body.fullName?.trim() || undefined,
      phone: body.phone?.trim() || undefined,
    }),
  });

  if (!authRes.ok) {
    const detail = await authRes.text().catch(() => '');
    return NextResponse.json({ error: `auth-api rejected user creation (${authRes.status}): ${detail || 'no detail'}` }, { status: 502 });
  }

  const member: {
    user_id?: string; id?: string; temp_password?: string;
  } = await authRes.json().catch(() => ({}));

  const userId = member.user_id ?? member.id;
  if (!userId) {
    return NextResponse.json({ error: 'auth-api did not return a user id' }, { status: 502 });
  }

  const siteUser = await prisma.siteUser.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email,
      fullName: body.fullName?.trim() || null,
      role: body.digitikaRoleCode,
      tenantId: platformTenantId,
      syncedFromSso: true,
      digitikaRoleCode: body.digitikaRoleCode,
    },
    update: {
      digitikaRoleCode: body.digitikaRoleCode,
      fullName: body.fullName?.trim() || undefined,
    },
    include: { digitikaRole: { select: { code: true, name: true } } },
  });

  return NextResponse.json({ user: siteUser, tempPassword: member.temp_password ?? null }, { status: 201 });
}
