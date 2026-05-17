import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { checkSpam } from '@/lib/spam-guard';
import { sendContactFormReply } from '@/lib/notifications';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  service: z.string().optional(),
  message: z.string().min(5),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const spamCheck = checkSpam({ name: data.name, email: data.email, message: data.message });
    if (spamCheck.blocked) {
      return NextResponse.json({ error: 'Submission blocked' }, { status: 422 });
    }

    await prisma.contactSubmission.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        service: data.service ?? null,
        message: data.message,
      },
    });

    // Fire-and-forget auto-reply to the visitor
    sendContactFormReply({
      name: data.name,
      email: data.email,
      message: data.message,
      service: data.service,
    }).catch((err) => console.error('[contact] notification error:', err));

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error('[contact]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
