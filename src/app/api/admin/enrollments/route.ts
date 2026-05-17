import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10));
  const status = url.searchParams.get('status') ?? undefined;
  const search = url.searchParams.get('search') ?? undefined;
  const courseId = url.searchParams.get('courseId') ?? undefined;

  const where = {
    ...(status ? { paymentStatus: status } : {}),
    ...(courseId ? { courseId } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { courseName: { contains: search, mode: 'insensitive' as const } },
            { studentUserId: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.enrollment.count({ where }),
    prisma.enrollment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        studentUser: { select: { id: true, email: true } },
        installments: { orderBy: { installmentNo: 'asc' } },
      },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pages: Math.ceil(total / limit),
    items: items.map((e) => ({
      ...e,
      id: e.id.toString(),
      cohortId: e.cohortId?.toString() ?? null,
      installments: e.installments.map((i) => ({
        ...i,
        id: i.id.toString(),
        enrollmentId: i.enrollmentId.toString(),
      })),
    })),
  });
}
