import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';
import { courseCreateSchema, courseWriteError } from '@/lib/course-schema';

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('courses', 'view'));
  if ('response' in guard) return guard.response;

  const url = new URL(req.url);
  const categoryId = url.searchParams.get('categoryId') ?? undefined;
  const includeInactive = url.searchParams.get('includeInactive') === 'true';

  const courses = await prisma.course.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(!includeInactive ? { isActive: true } : {}),
    },
    orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }],
  });

  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('courses', 'manage'));
  if ('response' in guard) return guard.response;

  try {
    const { metadata, installmentPlans, ...fields } = courseCreateSchema.parse(await req.json());
    const course = await prisma.course.create({
      data: {
        ...fields,
        installmentPlans: (installmentPlans ?? []) as Prisma.InputJsonValue,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
    return NextResponse.json(course, { status: 201 });
  } catch (err) {
    const mapped = courseWriteError(err);
    if (mapped) return NextResponse.json(mapped.body, { status: mapped.status });
    console.error('[admin/courses POST]', err);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
