import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Returns open cohorts for a course with registration status.
// registrationOpen = true when now is within [registrationFrom, effectiveDeadline]
// effectiveDeadline = registrationUntil + registrationExtDays days
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

  const now = new Date();
  const result = cohorts.map((c) => {
    const effectiveDeadline = c.registrationUntil
      ? new Date(c.registrationUntil.getTime() + c.registrationExtDays * 86_400_000)
      : null;
    const registrationOpen =
      (!c.registrationFrom || now >= c.registrationFrom) &&
      (!effectiveDeadline || now <= effectiveDeadline);

    return {
      id: c.id.toString(),
      name: c.name,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate?.toISOString() ?? null,
      registrationFrom: c.registrationFrom?.toISOString() ?? null,
      registrationUntil: c.registrationUntil?.toISOString() ?? null,
      registrationExtDays: c.registrationExtDays,
      effectiveDeadline: effectiveDeadline?.toISOString() ?? null,
      registrationOpen,
      maxSlots: c.maxSlots,
      enrolledCount: c._count.enrollments,
      availableSlots: Math.max(0, c.maxSlots - c._count.enrollments),
      isFull: c._count.enrollments >= c.maxSlots,
    };
  });

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
  });
}
