import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

const bodySchema = z.object({ completed: z.boolean() });

// POST /api/admin/students/[studentId]/lessons/[lessonId]/override
// Manual completion override — e.g. crediting a lesson for an offline/paper
// submission, or reopening one a student needs to redo. Same LessonProgress
// row the student-facing "mark complete" button writes to.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string; lessonId: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('classroom', 'manage'));
  if ('response' in guard) return guard.response;

  const { studentId, lessonId } = await params;
  const body = await req.json();
  const data = bodySchema.parse(body);

  const progress = await prisma.lessonProgress.upsert({
    where: { lessonId_studentUserId: { lessonId, studentUserId: studentId } },
    create: { lessonId, studentUserId: studentId, completedAt: data.completed ? new Date() : null },
    update: { completedAt: data.completed ? new Date() : null },
  });

  return NextResponse.json(progress);
}
