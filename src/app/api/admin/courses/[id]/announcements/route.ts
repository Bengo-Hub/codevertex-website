import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('classroom', 'view'));
  if ('response' in guard) return guard.response;

  const { id: courseId } = await params;
  const announcements = await prisma.courseAnnouncement.findMany({
    where: { courseId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ announcements });
}

const createSchema = z.object({
  title: z.string().min(2).max(200),
  body: z.string().min(2).max(5000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('classroom', 'manage'));
  if ('response' in guard) return guard.response;

  const { id: courseId } = await params;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const body = await req.json();
  const data = createSchema.parse(body);

  const announcement = await prisma.courseAnnouncement.create({ data: { courseId, ...data } });
  return NextResponse.json(announcement, { status: 201 });
}
