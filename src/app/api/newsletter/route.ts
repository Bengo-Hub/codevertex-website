import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const schema = z.object({
  email: z.string().email(),
  source: z.enum(['footer', 'blog', 'other']).default('footer'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, source } = schema.parse(body);

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email, source },
      // Re-subscribing after a previous unsubscribe clears the unsubscribedAt stamp.
      update: { unsubscribedAt: null },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }
    console.error('[newsletter]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
