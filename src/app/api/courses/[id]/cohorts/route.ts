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
  const result = cohorts
    .map((c) => {
      const effectiveDeadline = c.registrationUntil
        ? new Date(c.registrationUntil.getTime() + c.registrationExtDays * 86_400_000)
        : null;
      // Registration is gated only when the admin sets a window; an open cohort with
      // no dates is immediately enrollable.
      const registrationStarted = !c.registrationFrom || now >= c.registrationFrom;
      const registrationClosed = !!effectiveDeadline && now > effectiveDeadline;
      const registrationOpen = registrationStarted && !registrationClosed;
      const enrolledCount = c._count.enrollments;

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
        registrationClosed,
        maxSlots: c.maxSlots,
        enrolledCount,
        availableSlots: Math.max(0, c.maxSlots - enrolledCount),
        isFull: enrolledCount >= c.maxSlots,
      };
    })
    // Drop cohorts whose registration window has already closed — they can't be
    // enrolled in, so showing them would only dead-end the learner at submit.
    .filter((c) => !c.registrationClosed);

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
  });
}
