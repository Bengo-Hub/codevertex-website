import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkSpam } from '@/lib/spam-guard';
import { marketflow } from '@/lib/marketflow';

const schema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email().max(200).optional(),
  phone: z.string().trim().max(32).optional(),
  topic: z.string().trim().max(200).optional(),
  preferredTime: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
  source: z.string().trim().max(40).default('chatbot'),
});

/** A lead from the site's chat or forms, saved in MarketFlow (the CRM owns leads). */
export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json());
    if (!data.email && !data.phone) {
      return NextResponse.json({ error: 'Give an email or a phone number' }, { status: 400 });
    }

    const spamCheck = checkSpam({ name: data.name, email: data.email, message: data.notes });
    if (spamCheck.blocked) {
      return NextResponse.json({ error: 'Submission blocked' }, { status: 422 });
    }

    await marketflow.captureLead({
      name: data.name,
      email: data.email,
      phone: data.phone,
      interest: data.topic,
      source: data.source,
      metadata: {
        ...(data.preferredTime ? { preferred_time: data.preferredTime } : {}),
        ...(data.notes ? { notes: data.notes } : {}),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error('[leads]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
