import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';
import { isLeadId, LEAD_STATUSES, marketflow, MarketFlowError, splitName, toAdminLead } from '@/lib/marketflow';

const patchSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal('')),
  phone: z.string().trim().max(32).optional(),
  topic: z.string().trim().max(200).optional(),
  preferredTime: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
});

function failed(err: unknown, what: string) {
  if (err instanceof MarketFlowError && err.status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  console.error(`[admin/leads] ${what}`, err);
  return NextResponse.json({ error: `Could not ${what} the lead. Try again shortly.` }, { status: 502 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission(req, digitikaPerm('leads', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  if (!isLeadId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Check the lead details.' }, { status: 400 });
  const d = parsed.data;

  // Empty strings clear a value; metadata keys set to null are removed by MarketFlow.
  const patch: Record<string, unknown> = {};
  if (d.status) patch.status = d.status;
  if (d.name !== undefined) Object.assign(patch, { first_name: '', last_name: '' }, splitName(d.name));
  if (d.email !== undefined) patch.email = d.email;
  if (d.phone !== undefined) patch.phone = d.phone;
  if (d.topic !== undefined) patch.interest = d.topic;
  const metadata: Record<string, unknown> = {};
  if (d.preferredTime !== undefined) metadata.preferred_time = d.preferredTime || null;
  if (d.notes !== undefined) metadata.notes = d.notes || null;
  if (Object.keys(metadata).length) patch.metadata = metadata;

  try {
    return NextResponse.json(toAdminLead(await marketflow.patchLead(id, patch)));
  } catch (err) {
    return failed(err, 'update');
  }
}

/** MarketFlow keeps a lead's history: delete marks it lost. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission(req, digitikaPerm('leads', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  if (!isLeadId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    await marketflow.deleteLead(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return failed(err, 'delete');
  }
}
