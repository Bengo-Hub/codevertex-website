import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const bodySchema = z.object({
  completed: z.boolean().default(true),
  lastPositionSec: z.number().int().min(0).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string; lessonId: string }> }
) {
  const { studentId, lessonId } = await params;
  const sid = studentId.trim().toUpperCase();

  const student = await prisma.studentUser.findUnique({ where: { id: sid } });
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: true },
  });
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  // Don't let progress be recorded on content the student hasn't paid for and
  // isn't a free preview — mirrors the gating in the content GET route.
  if (!lesson.isPreview) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentUserId: sid, courseId: lesson.module.courseId },
    });
    const paid = enrollment && (enrollment.paymentStatus === 'succeeded' || enrollment.paymentStatus === 'paid');
    if (!paid) {
      return NextResponse.json({ error: 'No paid enrollment for this course' }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const data = bodySchema.parse(body);

  const progress = await prisma.lessonProgress.upsert({
    where: { lessonId_studentUserId: { lessonId, studentUserId: sid } },
    create: {
      lessonId,
      studentUserId: sid,
      completedAt: data.completed ? new Date() : null,
      lastPositionSec: data.lastPositionSec,
    },
    update: {
      ...(data.completed ? { completedAt: new Date() } : {}),
      ...(data.lastPositionSec !== undefined ? { lastPositionSec: data.lastPositionSec } : {}),
    },
  });

  return NextResponse.json(progress);
}
