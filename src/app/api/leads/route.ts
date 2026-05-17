import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { checkSpam } from '@/lib/spam-guard';

const schema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  topic: z.string().optional(),
  preferredTime: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().default('chatbot'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const spamCheck = checkSpam({ name: data.name, email: data.email, message: data.notes });
    if (spamCheck.blocked) {
      return NextResponse.json({ error: 'Submission blocked' }, { status: 422 });
    }

    await prisma.lead.create({
      data: {
        name: data.name ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        topic: data.topic ?? null,
        preferredTime: data.preferredTime ?? null,
        notes: data.notes ?? null,
        source: data.source,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[leads]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
