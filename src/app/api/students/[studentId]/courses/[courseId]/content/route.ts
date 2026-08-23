import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolvePaidAccess } from '@/lib/digitika-access';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string; courseId: string }> }
) {
  const { studentId, courseId } = await params;
  const { student, hasAccess } = await resolvePaidAccess(studentId, courseId);

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const modules = await prisma.courseModule.findMany({
    where: { courseId },
    orderBy: { sortOrder: 'asc' },
    include: {
      lessons: {
        orderBy: { sortOrder: 'asc' },
        include: {
          quiz: { include: { questions: true } },
          progress: { where: { studentUserId: student.id } },
        },
      },
    },
  });

  // Strip content the student hasn't paid for (unless it's a free-preview lesson),
  // and strip quiz answer keys either way — never send correctIndex to the client.
  const shaped = modules.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    lessons: m.lessons.map((l) => {
      const locked = !l.isPreview && !hasAccess;
      return {
        id: l.id,
        title: l.title,
        type: l.type,
        isPreview: l.isPreview,
        durationSec: l.durationSec,
        locked,
        completedAt: l.progress[0]?.completedAt ?? null,
        lastPositionSec: l.progress[0]?.lastPositionSec ?? null,
        content: locked ? null : l.content,
        videoUrl: locked ? null : l.videoUrl,
        videoUrlSd: locked ? null : l.videoUrlSd,
        resourceUrl: locked ? null : l.resourceUrl,
        resourceName: l.resourceName,
        quiz: locked || !l.quiz ? null : {
          id: l.quiz.id,
          title: l.quiz.title,
          passingScore: l.quiz.passingScore,
          questions: l.quiz.questions.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options })),
        },
      };
    }),
  }));

  const totalLessons = modules.reduce((n, m) => n + m.lessons.length, 0);
  const completedLessons = modules.reduce(
    (n, m) => n + m.lessons.filter((l) => l.progress[0]?.completedAt).length,
    0
  );

  return NextResponse.json({
    hasAccess,
    modules: shaped,
    progressPct: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    completedLessons,
    totalLessons,
  });
}
