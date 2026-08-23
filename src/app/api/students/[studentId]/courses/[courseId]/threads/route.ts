import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { resolvePaidAccess } from '@/lib/digitika-access';

// GET /api/students/[studentId]/courses/[courseId]/threads
// List Q&A threads for a course, newest-first with pinned threads on top, replies included.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string; courseId: string }> }
) {
  const { studentId, courseId } = await params;
  const { student } = await resolvePaidAccess(studentId, courseId);
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const threads = await prisma.courseThread.findMany({
    where: { courseId },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    include: {
      studentUser: { select: { fullName: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: { studentUser: { select: { fullName: true } } },
      },
    },
  });

  return NextResponse.json({
    threads: threads.map((t) => ({
      id: t.id,
      title: t.title,
      body: t.body,
      pinned: t.pinned,
      createdAt: t.createdAt,
      authorName: t.studentUser.fullName,
      isOwn: t.studentUserId === student.id,
      replies: t.replies.map((r) => ({
        id: r.id,
        body: r.body,
        createdAt: r.createdAt,
        isAdminReply: r.isAdminReply,
        authorName: r.isAdminReply ? (r.adminName ?? 'Codevertex Team') : (r.studentUser?.fullName ?? 'Student'),
      })),
    })),
  });
}

const createSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(5).max(5000),
});

// POST — create a new question thread. Requires a paid enrollment, same bar as
// viewing locked lesson content (see resolvePaidAccess) — this is a course-specific
// benefit, not a public forum.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string; courseId: string }> }
) {
  const { studentId, courseId } = await params;
  const { student, hasAccess } = await resolvePaidAccess(studentId, courseId);
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }
  if (!hasAccess) {
    return NextResponse.json({ error: 'Complete enrollment payment to post in the course discussion.' }, { status: 403 });
  }

  const body = await req.json();
  const data = createSchema.parse(body);

  const thread = await prisma.courseThread.create({
    data: { courseId, studentUserId: student.id, title: data.title, body: data.body },
  });

  return NextResponse.json({ id: thread.id }, { status: 201 });
}
