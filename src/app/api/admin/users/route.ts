import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('users', 'view'));
  if ('response' in guard) return guard.response;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '25', 10));
  const search = url.searchParams.get('search') ?? undefined;

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { fullName: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [total, items] = await Promise.all([
    prisma.siteUser.count({ where }),
    prisma.siteUser.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { digitikaRole: { select: { code: true, name: true } } },
    }),
  ]);

  return NextResponse.json({ total, page, pages: Math.ceil(total / limit), items });
}
