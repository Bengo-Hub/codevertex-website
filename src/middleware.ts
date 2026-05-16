import { NextRequest, NextResponse } from 'next/server';

const SSO_URL = process.env.NEXT_PUBLIC_SSO_URL ?? 'https://accounts.codevertexitsolutions.com';

function getAccessToken(req: NextRequest): string | null {
  return (
    req.cookies.get('access_token')?.value ??
    req.cookies.get('auth_token')?.value ??
    null
  );
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function isTokenExpired(payload: Record<string, unknown>): boolean {
  const exp = payload.exp as number | undefined;
  if (!exp) return false;
  return Date.now() / 1000 > exp;
}

function hasAdminRole(payload: Record<string, unknown>): boolean {
  const role = payload.role as string | undefined;
  const roles = payload.roles as string[] | undefined;
  return role === 'admin' || (Array.isArray(roles) && roles.includes('admin'));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const token = getAccessToken(req);

  if (!token) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = parseJwtPayload(token);

  if (!payload || isTokenExpired(payload)) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('returnTo', pathname);
    loginUrl.searchParams.set('reason', 'session_expired');
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('access_token');
    res.cookies.delete('auth_token');
    return res;
  }

  if (!hasAdminRole(payload)) {
    return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
