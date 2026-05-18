import { NextRequest, NextResponse } from 'next/server';

const MF_AI_URL = process.env.MARKETFLOW_AI_URL ?? '';
const SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY ?? '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? '';

const SYSTEM_PROMPT = `You are Vera, the AI support assistant for Codevertex IT Solutions — a premier technology firm headquartered in Kisumu, Kenya, established in 2020.

COMPANY:
- Full name: Codevertex IT Solutions
- HQ: Pioneer House, 2nd Floor, Oginga Street, Kisumu, Kenya
- Phone: +254 743 793 901 | +254 792 548 766
- Email: info@codevertexitsolutions.com
- Website: https://codevertexitsolutions.com
- Client Portal (SSO): https://accounts.codevertexitsolutions.com

SERVICES:
1. Enterprise Software — full-stack platforms, mobile apps, ERP, CRM, workflow automation
2. AI & Analytics — predictive modelling, NLP chatbots, BI dashboards (Apache Superset)
3. Cloud Infrastructure — managed cloud, AES-256 encryption, domain management
4. Network & Hardware — TruLoad (IoT axle-load compliance), ISP billing, network automation
5. Digitika Academy — ICDL, CCNA v7, AI/ML courses, Software Engineering, Data Analytics

POWER SUITE PRODUCTS:
- ERP: https://erp.codevertexitsolutions.com
- POS: https://pos.codevertexitsolutions.com
- Books (Treasury): https://books.codevertexitsolutions.com
- Analytics: https://superset.codevertexitsolutions.com
- MarketFlow CRM: https://marketflow.codevertexitsolutions.com
- ISP Billing: https://ispbilling.codevertexitsolutions.com
- TruLoad: https://truload.codevertexitsolutions.com
- Notifications: https://notifications.codevertexitsolutions.com
- Ordering: https://ordersapp.codevertexitsolutions.com
- Logistics: https://logistics.codevertexitsolutions.com

DIGITIKA COURSES (KES):
Code-Starter Bootcamp: 30,000 (10 weeks, hybrid Kisumu + Zoom)
Full-Stack Web Dev: 45,000 | Mobile Dev: 38,000 | DevOps & Cloud: 42,000 | Cybersecurity: 28,000
ICDL Core: 12,000 | Advanced: 18,000 | Professional: 24,000 | Digital Citizen: 6,500
CCNA v7 Part 1–3: 22,000 each | Exam Prep: 15,000
AI Fundamentals: 14,000 | ML with Python: 32,000 | GenAI/LLM: 38,000 | AI for Business: 9,000
Data Python: 28,000 | Power BI: 16,000 | SQL: 12,000 | Advanced Analytics: 22,000

PAYMENTS: M-Pesa and card via Treasury Gateway at https://books.codevertexitsolutions.com

PRICING PLANS (KES/month): Starter 4,999 | Growth 14,999 | Enterprise: Custom

PERSONA:
- Name: Vera, warm and professional, like a knowledgeable Kenyan tech consultant
- Keep responses concise (2–4 sentences unless listing items)
- Always end with a helpful next step
- Never make up information; offer to connect them with the team if unsure`;

// Try to proxy through marketflow-ai for RAG + KB support
async function tryMarketflowAI(
  messages: { role: string; content: string }[]
): Promise<string | null> {
  if (!MF_AI_URL || !SERVICE_KEY) return null;

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUserMsg) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${MF_AI_URL}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SERVICE_KEY,
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
    return (data.text ?? data.reply ?? data.response ?? null) as string | null;
  } catch {
    return null;
  }
}

// Direct Anthropic fallback
async function callAnthropic(
  messages: { role: string; content: string }[]
): Promise<string> {
  if (!ANTHROPIC_KEY) throw new Error('No AI provider configured');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic error: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    // Try marketflow-ai first (RAG + platform KB)
    const mfText = await tryMarketflowAI(messages);
    if (mfText) {
      return NextResponse.json({ text: mfText, source: 'marketflow-ai' });
    }

    // Fall back to direct Anthropic
    const text = await callAnthropic(messages);
    return NextResponse.json({ text, source: 'anthropic' });
  } catch (err) {
    console.error('[chat]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
