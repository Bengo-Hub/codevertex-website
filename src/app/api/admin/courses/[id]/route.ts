import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';
import { coursePatchSchema, courseWriteError, mergeCourseMetadata } from '@/lib/course-schema';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('courses', 'view'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(course);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('courses', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  try {
    const { metadata, installmentPlans, ...fields } = coursePatchSchema.parse(await req.json());

    // Metadata is merged (not replaced) so system keys such as _seedVersion survive.
    let mergedMetadata: Prisma.InputJsonValue | undefined;
    if (metadata) {
      const current = await prisma.course.findUnique({ where: { id }, select: { metadata: true } });
      if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      mergedMetadata = mergeCourseMetadata(current.metadata, metadata) as Prisma.InputJsonValue;
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...fields,
        ...(installmentPlans ? { installmentPlans: installmentPlans as Prisma.InputJsonValue } : {}),
        ...(mergedMetadata ? { metadata: mergedMetadata } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    const mapped = courseWriteError(err);
    if (mapped) return NextResponse.json(mapped.body, { status: mapped.status });
    console.error('[admin/courses PATCH]', err);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('courses', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  try {
    // Soft-delete by setting isActive = false (enrollments and certificates keep their course).
    const updated = await prisma.course.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json(updated);
  } catch (err) {
    const mapped = courseWriteError(err);
    if (mapped) return NextResponse.json(mapped.body, { status: mapped.status });
    console.error('[admin/courses DELETE]', err);
    return NextResponse.json({ error: 'Failed to deactivate course' }, { status: 500 });
  }
}
