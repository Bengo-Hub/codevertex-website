import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';
import { ENQUIRY_SOURCES, LEAD_STATUSES, marketflow, pagesOf, toAdminLead } from '@/lib/marketflow';

// Leads live in MarketFlow (the CRM). This page lists the codevertex tenant's leads from every
// source except the contact and attachment forms, which the Contacts page shows.

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('leads', 'view'));
  if ('response' in guard) return guard.response;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
  const status = url.searchParams.get('status') ?? '';
  const search = url.searchParams.get('search') ?? '';

  try {
    const res = await marketflow.listLeads({
      page,
      limit,
      q: search || undefined,
      status: (LEAD_STATUSES as readonly string[]).includes(status) ? [status] : undefined,
      excludeSource: ENQUIRY_SOURCES,
    });
    return NextResponse.json({ total: res.total, page, pages: pagesOf(res.total, limit), items: res.data.map(toAdminLead) });
  } catch (err) {
    console.error('[admin/leads]', err);
    return NextResponse.json({ error: 'Leads are unavailable right now. Try again shortly.' }, { status: 502 });
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().max(32).optional(),
  topic: z.string().trim().max(200).optional(),
  preferredTime: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
  source: z.string().trim().max(40).optional(),
}).refine((d) => d.email || d.phone, { message: 'Give an email or a phone number so the lead can be reached.' });

/** A lead taken by phone or in person. A person MarketFlow already has keeps their one lead. */
export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('leads', 'manage'));
  if ('response' in guard) return guard.response;
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Check the lead details.' }, { status: 400 });
  }
  const d = parsed.data;
  try {
    const { lead, created } = await marketflow.captureLead({
      name: d.name,
      email: d.email || null,
      phone: d.phone || null,
      interest: d.topic || null,
      source: d.source || 'manual',
      metadata: {
        ...(d.preferredTime ? { preferred_time: d.preferredTime } : {}),
        ...(d.notes ? { notes: d.notes } : {}),
      },
    });
    return NextResponse.json({ ...toAdminLead(lead), existing: !created }, { status: created ? 201 : 200 });
  } catch (err) {
    console.error('[admin/leads] create', err);
    return NextResponse.json({ error: 'Could not save the lead. Try again shortly.' }, { status: 502 });
  }
}
