import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const spamCheck = checkSpam({ name: data.name, email: data.email, message: data.message });
    if (spamCheck.blocked) {
      return NextResponse.json({ error: 'Submission blocked' }, { status: 422 });
    }

    const submission = await prisma.contactSubmission.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        service: data.service || null,
        message: data.message,
        source: data.source,
      },
      select: { id: true },
    });

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
    });
    if (sent) {
      await prisma.contactSubmission.update({ where: { id: submission.id }, data: { noticeSentAt: new Date() } });
    } else {
      console.error('[contact] acknowledgement not published, submission', submission.id.toString());
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
