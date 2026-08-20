import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

const questionSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int().min(0),
  sortOrder: z.number().int().default(0),
});

const upsertSchema = z.object({
  title: z.string().min(2),
  passingScore: z.number().int().min(0).max(100).default(70),
  questions: z.array(questionSchema).min(1),
});

/**
 * Creates or fully replaces the quiz (and all its questions) attached to a
 * QUIZ-type lesson. Replacing rather than diffing keeps the admin quiz editor
 * simple — a course's quiz bank is small enough that this is cheap, and it
 * avoids stale-question bugs from partial updates.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('content', 'manage'));
  if ('response' in guard) return guard.response;

  const { id: lessonId } = await params;
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }
  if (lesson.type !== 'QUIZ') {
    return NextResponse.json({ error: 'Lesson is not a QUIZ-type lesson' }, { status: 400 });
  }

  const body = await req.json();
  const data = upsertSchema.parse(body);

  const quiz = await prisma.$transaction(async (tx) => {
    const upserted = await tx.quiz.upsert({
      where: { lessonId },
      create: { lessonId, title: data.title, passingScore: data.passingScore },
      update: { title: data.title, passingScore: data.passingScore },
    });

    await tx.quizQuestion.deleteMany({ where: { quizId: upserted.id } });
    await tx.quizQuestion.createMany({
      data: data.questions.map((q, i) => ({
        quizId: upserted.id,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        sortOrder: q.sortOrder ?? i,
      })),
    });

    return tx.quiz.findUnique({ where: { id: upserted.id }, include: { questions: true } });
  });

  return NextResponse.json(quiz);
}
