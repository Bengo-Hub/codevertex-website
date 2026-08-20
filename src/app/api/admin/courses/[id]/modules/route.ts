import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('content', 'view'));
  if ('response' in guard) return guard.response;

  const { id: courseId } = await params;

  const modules = await prisma.courseModule.findMany({
    where: { courseId },
    orderBy: { sortOrder: 'asc' },
    include: {
      lessons: {
        orderBy: { sortOrder: 'asc' },
        include: { quiz: { include: { questions: true } } },
      },
    },
  });

  return NextResponse.json(modules);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('content', 'manage'));
  if ('response' in guard) return guard.response;

  const { id: courseId } = await params;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const body = await req.json();
  const data = createSchema.parse(body);

  const courseModule = await prisma.courseModule.create({
    data: { courseId, ...data },
  });

  return NextResponse.json(courseModule, { status: 201 });
}
