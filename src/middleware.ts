import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth is handled client-side in the admin layout (same pattern as cafe-website dashboard).
// Middleware only needs to exist for Next.js to pick up the matcher config.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)'],
};
