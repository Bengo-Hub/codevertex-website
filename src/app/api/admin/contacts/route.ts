import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';
import { ENQUIRY_SOURCES, marketflow, OPEN_STATUSES, pagesOf, toAdminContact } from '@/lib/marketflow';

// Contact and attachment form enquiries are leads in MarketFlow (sources website_contact and
// website_attachment). Removed ones are marked lost there and leave this list.

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('contacts', 'view'));
  if ('response' in guard) return guard.response;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
  const search = url.searchParams.get('search') ?? '';

  try {
    const res = await marketflow.listLeads({ page, limit, q: search || undefined, source: ENQUIRY_SOURCES, status: OPEN_STATUSES });
    return NextResponse.json({ total: res.total, page, pages: pagesOf(res.total, limit), items: res.data.map(toAdminContact) });
  } catch (err) {
    console.error('[admin/contacts]', err);
    return NextResponse.json({ error: 'Enquiries are unavailable right now. Try again shortly.' }, { status: 502 });
  }
}
