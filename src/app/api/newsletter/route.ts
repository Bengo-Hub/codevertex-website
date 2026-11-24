import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { marketflow } from '@/lib/marketflow';

const schema = z.object({
  email: z.string().trim().email().max(200),
  source: z.enum(['footer', 'blog', 'other']).default('footer'),
});

/**
 * Newsletter signup: the person becomes (or stays) a MarketFlow contact with their email opt-in
 * recorded, with where and when they gave it. MarketFlow owns contacts and their consent.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, source } = schema.parse(await req.json());
    await marketflow.upsertContacts([
      {
        external_ref: `codevertex-website:newsletter:${email.toLowerCase()}`,
        email,
        contact_type: 'customer',
        subscribed_email: true,
        metadata: {
          consent_source: `codevertex-website newsletter (${source})`,
          consent_at: new Date().toISOString(),
        },
      },
    ]);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }
    console.error('[newsletter]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
