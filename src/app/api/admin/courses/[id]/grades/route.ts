import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

// GET /api/admin/courses/[id]/grades
// Roster of every student paid-enrolled in the course, with lesson-completion
// progress and quiz scores — the "grading" surface. There's nothing to hand-grade
// beyond marking completion, since lessons are auto-completed/auto-scored; this
// gives admins visibility plus a manual override (see lessons/[lessonId]/override).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('classroom', 'view'));
  if ('response' in guard) return guard.response;

  const { id: courseId } = await params;

  const [modules, enrollments] = await Promise.all([
    prisma.courseModule.findMany({
      where: { courseId },
      orderBy: { sortOrder: 'asc' },
      include: { lessons: { orderBy: { sortOrder: 'asc' }, include: { quiz: true } } },
    }),
    prisma.enrollment.findMany({
      where: { courseId, paymentStatus: { in: ['succeeded', 'paid'] }, studentUserId: { not: null } },
      orderBy: { createdAt: 'desc' },
      distinct: ['studentUserId'],
      include: { studentUser: true },
    }),
  ]);

  const lessons = modules.flatMap((m) => m.lessons);
  const lessonIds = lessons.map((l) => l.id);
  const quizIds = lessons.filter((l) => l.quiz).map((l) => l.quiz!.id);
  const studentIds = enrollments.map((e) => e.studentUserId).filter((id): id is string => Boolean(id));

  const [progressRows, attemptRows] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { lessonId: { in: lessonIds }, studentUserId: { in: studentIds } },
    }),
    prisma.quizAttempt.findMany({
      where: { quizId: { in: quizIds }, studentUserId: { in: studentIds } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const roster = enrollments
    .filter((e) => e.studentUser)
    .map((e) => {
      const sid = e.studentUser!.id;
      const completed = progressRows.filter((p) => p.studentUserId === sid && p.completedAt).length;
      const progressPct = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0;

      const quizScores = lessons
        .filter((l) => l.quiz)
        .map((l) => {
          const best = attemptRows.find((a) => a.quizId === l.quiz!.id && a.studentUserId === sid);
          return { lessonTitle: l.title, scorePct: best?.scorePct ?? null, passed: best?.passed ?? false };
        });

      return {
        studentId: sid,
        fullName: e.studentUser!.fullName,
        email: e.studentUser!.email,
        completedLessons: completed,
        totalLessons: lessons.length,
        progressPct,
        quizScores,
      };
    });

  return NextResponse.json({
    roster,
    lessons: lessons.map((l) => ({ id: l.id, title: l.title, type: l.type })),
  });
}
