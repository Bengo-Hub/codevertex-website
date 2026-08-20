import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

const createSchema = z.object({
  title: z.string().min(2),
  type: z.enum(['VIDEO', 'TEXT', 'QUIZ', 'RESOURCE']).default('TEXT'),
  content: z.string().optional(),
  videoUrl: z.string().optional(),
  durationSec: z.number().int().optional(),
  resourceUrl: z.string().optional(),
  resourceName: z.string().optional(),
  isPreview: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('content', 'manage'));
  if ('response' in guard) return guard.response;

  const { id: moduleId } = await params;
  const courseModule = await prisma.courseModule.findUnique({ where: { id: moduleId } });
  if (!courseModule) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 });
  }

  const body = await req.json();
  const data = createSchema.parse(body);

  const lesson = await prisma.lesson.create({ data: { moduleId, ...data } });
  return NextResponse.json(lesson, { status: 201 });
}
