import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

const replySchema = z.object({ body: z.string().min(1).max(5000) });

// POST /api/admin/threads/[id]/replies — admin answers a student question.
// Recorded as isAdminReply with a name snapshot, not tied to a special "instructor"
// account type — any admin/staff user with classroom.manage can answer.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('classroom', 'manage'));
  if ('response' in guard) return guard.response;

  const { id: threadId } = await params;
  const thread = await prisma.courseThread.findUnique({ where: { id: threadId } });
  if (!thread) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
  }

  const body = await req.json();
  const data = replySchema.parse(body);

  const reply = await prisma.courseReply.create({
    data: {
      threadId,
      isAdminReply: true,
      adminName: guard.session.fullName ?? 'Codevertex Team',
      body: data.body,
    },
  });

  return NextResponse.json({ id: reply.id }, { status: 201 });
}
