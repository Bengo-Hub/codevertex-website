import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';
import { publishContactReceived } from '@/lib/events';
import { enquiryTopicLabel } from '@/config/services';

/**
 * Publishes a submission's acknowledgement again (visitor email and WhatsApp, team email), for
 * one that was never sent or that the visitor says never arrived.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission(req, digitikaPerm('contacts', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const c = await prisma.contactSubmission.findUnique({ where: { id: BigInt(id) } });
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });
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

  const updated = await prisma.contactSubmission.update({ where: { id: c.id }, data: { noticeSentAt: new Date() } });
  return NextResponse.json({ success: true, noticeSentAt: updated.noticeSentAt });
}
