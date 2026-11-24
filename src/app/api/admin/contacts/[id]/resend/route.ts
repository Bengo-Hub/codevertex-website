import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';
import { publishContactReceived } from '@/lib/events';
import { enquiryTopicLabel } from '@/config/services';
import { isLeadId, marketflow, MarketFlowError, toAdminContact } from '@/lib/marketflow';

/**
 * Publishes an enquiry's acknowledgement again (visitor email and WhatsApp, team email), for one
 * that was never sent or that the visitor says never arrived.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission(req, digitikaPerm('contacts', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  if (!isLeadId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  let c: ReturnType<typeof toAdminContact>;
  try {
    c = toAdminContact(await marketflow.getLead(id));
  } catch (err) {
    if (err instanceof MarketFlowError && err.status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    console.error('[admin/contacts] resend', err);
    return NextResponse.json({ error: 'Enquiries are unavailable right now. Try again shortly.' }, { status: 502 });
  }
  if (!c.phone) {
    return NextResponse.json({ error: 'This enquiry has no phone number, so only email can reach the visitor' }, { status: 422 });
  }

  const sent = await publishContactReceived({
    name: c.name,
    email: c.email,
    phone: c.phone,
    message: c.message,
    service: c.service ?? undefined,
    serviceLabel: enquiryTopicLabel(c.service),
    source: c.source === 'attachment' ? 'attachment' : 'contact',
  });
  if (!sent) return NextResponse.json({ error: 'The notification service is unreachable. Try again shortly.' }, { status: 503 });

  const noticeSentAt = new Date().toISOString();
  await marketflow
    .patchLead(id, { metadata: { notice_sent_at: noticeSentAt } })
    .catch((e) => console.error('[admin/contacts] notice time not saved, lead', id, e));
  return NextResponse.json({ success: true, noticeSentAt });
}
