import { NextRequest, NextResponse } from 'next/server';

const SSO_API_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'https://sso.codevertexitsolutions.com';
const SESSION_MAX_AGE = 3600; // 1 hour

export async function POST(req: NextRequest) {
  let accessToken: string | undefined;
  try {
    ({ accessToken } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'Missing accessToken' }, { status: 400 });
  }

  // Verify token with SSO and get role
  const profileRes = await fetch(`${SSO_API_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!profileRes.ok) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const profile = await profileRes.json();
  const role: string = (Array.isArray(profile.roles) && profile.roles[0]) ?? profile.role ?? 'member';
  const userId: string = profile.id ?? profile.sub ?? '';
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;

  // Encode a minimal, unsigned session payload — used only for middleware routing,
  // not as a security boundary (the SSO token is the real credential).
  // base64url avoids +/= chars that can corrupt cookie values
  const payload = Buffer.from(JSON.stringify({ userId, role, exp })).toString('base64url');

  const res = NextResponse.json({ ok: true, role });
  res.cookies.set('cv_session', payload, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('cv_session');
  return res;
}
