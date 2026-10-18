import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { scoreLead } from '@/lib/lead-scoring';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('leads', 'view'));
  if ('response' in guard) return guard.response;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10));
  const status = url.searchParams.get('status') ?? undefined;
  const search = url.searchParams.get('search') ?? undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
            { topic: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pages: Math.ceil(total / limit),
    items: items.map((l) => ({ ...l, id: l.id.toString() })),
  });
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().max(32).optional(),
  topic: z.string().trim().max(200).optional(),
  preferredTime: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
  source: z.string().trim().max(40).optional(),
}).refine((d) => d.email || d.phone, { message: 'Give an email or a phone number so the lead can be reached.' });

/** A lead taken by phone or in person, scored by the same rules as chatbot leads. */
export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('leads', 'manage'));
  if ('response' in guard) return guard.response;
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Check the lead details.' }, { status: 400 });
  }
  const d = parsed.data;
  const source = d.source || 'manual';
  const lead = await prisma.lead.create({
    data: {
      name: d.name,
      email: d.email || null,
      phone: d.phone || null,
      topic: d.topic || null,
      preferredTime: d.preferredTime || null,
      notes: d.notes || null,
      source,
      score: scoreLead({ email: d.email, phone: d.phone, topic: d.topic, preferredTime: d.preferredTime, notes: d.notes, source }),
    },
  });
  return NextResponse.json({ ...lead, id: lead.id.toString() }, { status: 201 });
}
