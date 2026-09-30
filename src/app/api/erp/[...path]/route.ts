import { NextRequest } from 'next/server';

// Same-origin proxy for the public careers endpoints of erp-api.
//
// The careers UI (@bengo-hub/shared-ui-lib/careers) calls erp-api straight from the
// visitor's browser, which fails with a CORS error unless erp-api allows every origin
// that serves this site (including localhost in development). Routing the calls through
// this site removes the browser-to-ERP cross-origin request entirely.
//
// Only the endpoints the careers UI needs are allowed, so this is not an open proxy.

export const dynamic = 'force-dynamic';

const ERP_API = (process.env.NEXT_PUBLIC_ERP_API_URL ?? 'https://erpapi.codevertexafrica.com').replace(/\/$/, '');

const LIST_OR_DETAIL = /^api\/v1\/careers\/[^/]+\/postings(\/[^/]+)?$/;
const APPLY = /^api\/v1\/careers\/[^/]+\/postings\/[^/]+\/applications$/;
const BRANDING = /^api\/v1\/business\/public-branding$/;

function upstreamUrl(path: string, search: string): string {
  // erp-api serves the branding endpoint with a trailing slash; Next strips it from the
  // incoming request, so put it back.
  const suffix = BRANDING.test(path) ? '/' : '';
  return `${ERP_API}/${path}${suffix}${search}`;
}

async function forward(req: NextRequest, params: Promise<{ path: string[] }>, method: 'GET' | 'POST') {
  const path = (await params).path.join('/');
  const allowed = method === 'GET' ? LIST_OR_DETAIL.test(path) || BRANDING.test(path) : APPLY.test(path);
  if (!allowed) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  const contentType = req.headers.get('content-type');
  if (method === 'POST' && contentType) headers['Content-Type'] = contentType;
  // Let erp-api rate-limit by the real visitor, not by this server.
  const clientIp = req.headers.get('x-forwarded-for');
  if (clientIp) headers['X-Forwarded-For'] = clientIp;

  try {
    const res = await fetch(upstreamUrl(path, req.nextUrl.search), {
      method,
      headers,
      body: method === 'POST' ? await req.text() : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    return new Response(res.body, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return Response.json({ error: 'Careers service is unavailable. Please try again shortly.' }, { status: 502 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, params, 'GET');
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, params, 'POST');
}
