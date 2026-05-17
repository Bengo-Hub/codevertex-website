import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const categoryId = url.searchParams.get('categoryId') ?? undefined;

  const courses = await prisma.course.findMany({
    where: {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }],
  });

  return NextResponse.json(courses, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
