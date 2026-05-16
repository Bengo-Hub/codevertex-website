import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10));
  const search = url.searchParams.get('search') ?? undefined;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { service: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [total, items] = await Promise.all([
    prisma.contactSubmission.count({ where }),
    prisma.contactSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pages: Math.ceil(total / limit),
    items: items.map((c) => ({ ...c, id: c.id.toString() })),
  });
}
