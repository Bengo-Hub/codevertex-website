import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

// Attachment applications, job enquiries and service pitches: kept here, never as MarketFlow leads.
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('contacts', 'view'));
  if ('response' in guard) return guard.response;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
  const search = url.searchParams.get('search') ?? '';
  const kind = url.searchParams.get('kind') ?? '';

  const where = {
    ...(['attachment', 'job', 'service_offer'].includes(kind) ? { kind } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { message: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
  ]);
  return NextResponse.json({
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    items: items.map((a) => ({ ...a, id: a.id.toString() })),
  });
}
