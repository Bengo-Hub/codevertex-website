import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { marketflow, enquirySource } from '@/lib/marketflow';
import { prisma } from '@/lib/db';
import { classifyEnquiry } from '@/config/enquiry-classification';
import { checkSpam } from '@/lib/spam-guard';
import { publishContactReceived } from '@/lib/events';
import { normalisePhone } from '@/lib/phone-countries';
import { enquiryTopicLabel } from '@/config/services';

// Phone is required: the acknowledgement goes out on WhatsApp as well as email, and the team
// calls back on it. Numbers are stored in international form (+254712345678).
const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .transform((v, ctx) => {
      const phone = normalisePhone(v);
      if (!phone) {
        ctx.addIssue({ code: 'custom', message: 'Enter a valid phone number, e.g. 0712 345 678 or +255 712 345 678' });
        return z.NEVER;
      }
      return phone;
    }),
  service: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10).max(5000),
  /** Which form sent it: the contact page or the attachment application. */
  source: z.enum(['contact', 'attachment']).default('contact'),
});

/** The acknowledgement channels the site keeps for a sales lead (owner, 2026-11-24). */
function leadAckChannels(): Array<'email' | 'whatsapp'> {
  const raw = process.env.CONTACT_LEAD_ACK_CHANNELS ?? 'whatsapp';
  return raw
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter((c): c is 'email' | 'whatsapp' => c === 'email' || c === 'whatsapp');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const spamCheck = checkSpam({ name: data.name, email: data.email, message: data.message });
    if (spamCheck.blocked) {
      return NextResponse.json({ error: 'Submission blocked' }, { status: 422 });
    }

    // Attachment applications, job enquiries and businesses offering services are not sales leads
    // (owner, 2026-11-24): they go to the applications store, never to MarketFlow. A real enquiry
    // is a lead in MarketFlow (the CRM owns leads); a person who wrote before keeps one lead.
    const kind = classifyEnquiry({ form: data.source, service: data.service, message: data.message });
    let markSent: () => Promise<unknown>;
    if (kind === 'lead') {
      const { lead } = await marketflow.captureLead({
        name: data.name,
        email: data.email,
        phone: data.phone,
        interest: enquiryTopicLabel(data.service) ?? data.service,
        source: enquirySource(data.source),
        metadata: {
          form: data.source,
          message: data.message,
          ...(data.service ? { service: data.service } : {}),
        },
      });
      markSent = () => marketflow.patchLead(lead.id, { metadata: { notice_sent_at: new Date().toISOString() } });
    } else {
      const app = await prisma.application.create({
        data: { kind, name: data.name, email: data.email, phone: data.phone, service: data.service || null, message: data.message, form: data.source },
        select: { id: true },
      });
      markSent = () => prisma.application.update({ where: { id: app.id }, data: { noticeSentAt: new Date() } });
    }
    // A business pitching its services gets no acknowledgement.
    if (kind === 'service_offer') return NextResponse.json({ success: true });

    // notifications-api acknowledges the visitor by email and WhatsApp and emails the team.
    // The send time is recorded so an unsent notice can be resent from /admin/contacts.
    const sent = await publishContactReceived({
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      service: data.service,
      serviceLabel: enquiryTopicLabel(data.service),
      source: data.source,
      // MarketFlow already emails a sales lead (thank-you with the booking link) and the team, so
      // the site keeps only the channels in CONTACT_LEAD_ACK_CHANNELS (default "whatsapp"; set it
      // empty once MarketFlow's WhatsApp hello is approved). Applications keep both and the alert.
      ...(kind === 'lead' ? { channels: leadAckChannels(), teamAlert: false } : {}),
    });
    if (sent) {
      await markSent().catch((e) => console.error('[contact] notice time not saved', e));
    } else {
      console.error('[contact] acknowledgement not published', kind);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error('[contact]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
