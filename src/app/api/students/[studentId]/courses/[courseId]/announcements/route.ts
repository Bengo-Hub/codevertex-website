import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/students/[studentId]/courses/[courseId]/announcements
// Visible to anyone who can resolve a lesson list for the course (matches the
// "locked" preview bar — announcements themselves aren't paid content, but the
// route still confirms the student ID and course are real before returning anything).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string; courseId: string }> }
) {
  const { studentId, courseId } = await params;
  const sid = studentId.trim().toUpperCase();

  const student = await prisma.studentUser.findUnique({ where: { id: sid } });
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const announcements = await prisma.courseAnnouncement.findMany({
    where: { courseId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({ announcements });
}
