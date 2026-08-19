/**
 * GET /api/auth/me
 *
 * Trinity Layer 3 enrichment endpoint — called by the frontend right after the SSO
 * `/api/v1/auth/me` fetch. Resolves this user's LOCAL Digitika admin-panel role +
 * fine-grained `digitika.*.*` permissions (see src/lib/auth/rbac.ts) and JIT-upserts
 * their SiteUser row so they show up in the admin Users page on first login.
 *
 * Auth: Authorization: Bearer <SSO access token>
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveDigitikaSession, canAccessAdminPanel } from '@/lib/auth/rbac';

export async function GET(req: NextRequest) {
  const session = await resolveDigitikaSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  return NextResponse.json({
    id: session.userId,
    email: session.email,
    fullName: session.fullName,
    digitikaRole: session.digitikaRoleCode,
    permissions: session.isBypass ? ['*'] : session.permissions,
    canAccessAdminPanel: canAccessAdminPanel(session),
  });
}
