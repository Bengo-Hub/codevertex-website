import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const replySchema = z.object({ body: z.string().min(1).max(5000) });

// POST /api/students/[studentId]/threads/[threadId]/replies — a student reply on a thread.
// Requires the paid-access bar for the thread's course, same as starting a thread.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string; threadId: string }> }
) {
  const { studentId, threadId } = await params;
  const sid = studentId.trim().toUpperCase();

  const thread = await prisma.courseThread.findUnique({ where: { id: threadId } });
  if (!thread) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
  }

  const student = await prisma.studentUser.findUnique({ where: { id: sid } });
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentUserId: student.id, courseId: thread.courseId },
    orderBy: { createdAt: 'desc' },
  });
  const hasAccess = Boolean(enrollment && ['succeeded', 'paid'].includes(enrollment.paymentStatus));
  if (!hasAccess) {
    return NextResponse.json({ error: 'Complete enrollment payment to reply in the course discussion.' }, { status: 403 });
  }

  const body = await req.json();
  const data = replySchema.parse(body);

  const reply = await prisma.courseReply.create({
    data: { threadId, studentUserId: student.id, body: data.body },
  });

  return NextResponse.json({ id: reply.id }, { status: 201 });
}
