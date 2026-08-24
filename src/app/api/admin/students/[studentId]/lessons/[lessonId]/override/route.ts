import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';
const bodySchema = z.object({ completed: z.boolean() });
// POST /api/admin/students/[studentId]/lessons/[lessonId]/override
// Manual completion override â€” e.g. crediting a lesson for an offline/paper
// submission, or reopening one a student needs to redo. Same LessonProgress
// row the student-facing "mark complete" button writes to.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string; lessonId: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('classroom', 'manage'));
  if ('response' in guard) return guard.response;
  const { studentId, lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: true },
  });
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  // Mirrors the enrollment check in the student-facing complete route â€” an
  // admin override should still only apply to a course the student is
  // actually enrolled in, so this can't be used to silently mark progress
  // for a course the student never paid for or joined.
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentUserId: studentId, courseId: lesson.module.courseId },
  });
  const enrolled = enrollment && (enrollment.paymentStatus === 'succeeded' || enrollment.paymentStatus === 'paid');
  if (!enrolled) {
    return NextResponse.json({ error: 'Student is not enrolled in this course' }, { status: 400 });
  }

  const body = await req.json();
  const data = bodySchema.parse(body);
  const progress = await prisma.lessonProgress.upsert({
    where: { lessonId_studentUserId: { lessonId, studentUserId: studentId } },
    create: { lessonId, studentUserId: studentId, completedAt: data.completed ? new Date() : null },
    update: { completedAt: data.completed ? new Date() : null },
  });
  return NextResponse.json(progress);
}
