import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const createSchema = z.object({
  courseId: z.string(),
  name: z.string().min(2),
  startDate: z.string(),
  endDate: z.string().optional(),
  registrationFrom: z.string().optional(),
  registrationUntil: z.string().optional(),
  registrationExtDays: z.number().int().min(0).default(0),
  maxSlots: z.number().default(20),
  status: z.enum(['open', 'full', 'closed', 'completed']).default('open'),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const courseId = url.searchParams.get('courseId') ?? undefined;

  const items = await prisma.cohort.findMany({
    where: courseId ? { courseId } : {},
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { enrollments: true } } },
  });

  return NextResponse.json(items.map((c) => ({ ...c, id: c.id.toString() })));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = createSchema.parse(body);

  const cohort = await prisma.cohort.create({
    data: {
      courseId: data.courseId,
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      registrationFrom: data.registrationFrom ? new Date(data.registrationFrom) : null,
      registrationUntil: data.registrationUntil ? new Date(data.registrationUntil) : null,
      registrationExtDays: data.registrationExtDays,
      maxSlots: data.maxSlots,
      status: data.status,
    },
  });

  return NextResponse.json({ ...cohort, id: cohort.id.toString() }, { status: 201 });
}
