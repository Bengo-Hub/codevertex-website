import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Returns active cohorts for a course, with enrolled count and available slots.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cohorts = await prisma.cohort.findMany({
    where: {
      courseId: id,
      status: 'open',
      startDate: { gte: today },
    },
    orderBy: { startDate: 'asc' },
    include: {
      _count: { select: { enrollments: true } },
    },
  });

  const result = cohorts.map((c) => ({
    id: c.id.toString(),
    name: c.name,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate?.toISOString() ?? null,
    maxSlots: c.maxSlots,
    enrolledCount: c._count.enrollments,
    availableSlots: Math.max(0, c.maxSlots - c._count.enrollments),
    isFull: c._count.enrollments >= c.maxSlots,
  }));

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
  });
}
