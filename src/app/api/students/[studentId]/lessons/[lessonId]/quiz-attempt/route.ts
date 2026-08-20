import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const bodySchema = z.object({
  answers: z.array(z.number().int().min(0)),
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
    include: { module: true, quiz: { include: { questions: { orderBy: { sortOrder: 'asc' } } } } },
  });
  if (!lesson || !lesson.quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }

  if (!lesson.isPreview) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentUserId: sid, courseId: lesson.module.courseId },
    });
    const paid = enrollment && (enrollment.paymentStatus === 'succeeded' || enrollment.paymentStatus === 'paid');
    if (!paid) {
      return NextResponse.json({ error: 'No paid enrollment for this course' }, { status: 403 });
    }
  }

  const { answers } = bodySchema.parse(await req.json());
  const questions = lesson.quiz.questions;

  if (answers.length !== questions.length) {
    return NextResponse.json({ error: `Expected ${questions.length} answers, got ${answers.length}` }, { status: 400 });
  }

  // Graded server-side only — the client never receives correctIndex (see content route).
  const correctCount = questions.reduce((n, q, i) => n + (q.correctIndex === answers[i] ? 1 : 0), 0);
  const scorePct = Math.round((correctCount / questions.length) * 100);
  const passed = scorePct >= lesson.quiz.passingScore;

  const attempt = await prisma.$transaction(async (tx) => {
    const created = await tx.quizAttempt.create({
      data: { quizId: lesson.quiz!.id, studentUserId: sid, scorePct, passed, answers },
    });

    if (passed) {
      await tx.lessonProgress.upsert({
        where: { lessonId_studentUserId: { lessonId, studentUserId: sid } },
        create: { lessonId, studentUserId: sid, completedAt: new Date() },
        update: { completedAt: new Date() },
      });
    }

    return created;
  });

  return NextResponse.json({
    attemptId: attempt.id,
    scorePct,
    passed,
    passingScore: lesson.quiz.passingScore,
    correctCount,
    totalQuestions: questions.length,
  });
}
