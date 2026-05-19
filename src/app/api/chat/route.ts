import { NextRequest, NextResponse } from 'next/server';

const MF_AI_URL = process.env.MARKETFLOW_AI_URL ?? '';
const SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY ?? '';

// Try to proxy through marketflow-ai for RAG + KB support
async function tryMarketflowAI(
  messages: { role: string; content: string }[]
): Promise<string | null> {
  if (!MF_AI_URL || !SERVICE_KEY) return null;

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUserMsg) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const res = await fetch(`${MF_AI_URL}/api/v1/public/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SERVICE_KEY,
        // X-Tenant-ID is required by the chat handler even in public mode.
        // "codevertex" resolves to a deterministic slug-UUID for KB scoping.
        'X-Tenant-ID': 'codevertex',
      },
      body: JSON.stringify({
        question: lastUserMsg.content,
        session_id: `website-${Date.now()}`,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    // Response envelope: { session_id, result: { response, intent, ... } }
    return (data.result?.response ?? data.text ?? data.reply ?? data.response ?? null) as string | null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    const mfText = await tryMarketflowAI(messages);
    if (mfText) {
      return NextResponse.json({ text: mfText, source: 'marketflow-ai' });
    }

    return NextResponse.json({
      text: "I'm having trouble connecting right now. Please try again in a moment, or reach us directly at info@codevertexitsolutions.com or +254 743 793 901.",
      source: 'fallback',
    });
  } catch (err) {
    console.error('[chat]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
