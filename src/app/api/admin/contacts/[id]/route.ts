import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';
import { isLeadId, marketflow, MarketFlowError } from '@/lib/marketflow';

/** Removes an enquiry (spam or already dealt with): MarketFlow marks the lead lost. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission(req, digitikaPerm('contacts', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  if (!isLeadId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    await marketflow.deleteLead(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof MarketFlowError && err.status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    console.error('[admin/contacts] delete', err);
    return NextResponse.json({ error: 'Could not remove the enquiry. Try again shortly.' }, { status: 502 });
  }
}
