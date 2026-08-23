import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

// GET /api/admin/courses/[id]/threads — all Q&A threads for a course, for moderation/answering.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('classroom', 'view'));
  if ('response' in guard) return guard.response;

  const { id: courseId } = await params;
  const threads = await prisma.courseThread.findMany({
    where: { courseId },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    include: {
      studentUser: { select: { fullName: true, id: true } },
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
      authorId: t.studentUser.id,
      unanswered: !t.replies.some((r) => r.isAdminReply),
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
