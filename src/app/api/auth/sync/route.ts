/**
 * POST /api/auth/sync
 *
 * Called by marketflow-ai or any backend service via S2S (X-API-Key) after a user
 * authenticates via the Codevertex SSO (accounts.codevertexafrica.com).
 * Creates or updates a SiteUser record so the website knows about the logged-in user.
 *
 * Auth: X-API-Key: INTERNAL_SERVICE_KEY
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  const internalKey = process.env.INTERNAL_SERVICE_KEY;

  if (!internalKey || !apiKey || apiKey !== internalKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, email, fullName, avatarUrl, role, tenantId, tenantSlug } = body;

  if (!id || !email) {
    return NextResponse.json({ error: 'id and email are required' }, { status: 400 });
  }

  const user = await prisma.siteUser.upsert({
    where: { id },
    create: {
      id,
      email,
      fullName: fullName ?? null,
      avatarUrl: avatarUrl ?? null,
      role: role ?? 'member',
      tenantId: tenantId ?? null,
      tenantSlug: tenantSlug ?? null,
      lastLoginAt: new Date(),
    },
    update: {
      email,
      fullName: fullName ?? undefined,
      avatarUrl: avatarUrl ?? undefined,
      role: role ?? undefined,
      tenantId: tenantId ?? undefined,
      tenantSlug: tenantSlug ?? undefined,
      lastLoginAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, userId: user.id });
}
