import { NextRequest, NextResponse } from 'next/server';

interface CvSession {
  userId: string;
  role: string;
  exp: number;
}

function getCvSession(req: NextRequest): CvSession | null {
  const raw = req.cookies.get('cv_session')?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) as CvSession;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const session = getCvSession(req);

  // No session cookie — send to login page which triggers SSO
  if (!session) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session expired
  if (session.exp < Math.floor(Date.now() / 1000)) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('returnTo', pathname);
    loginUrl.searchParams.set('reason', 'session_expired');
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('cv_session');
    return res;
  }

  // Authenticated but not admin
  if (session.role !== 'admin') {
    return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
