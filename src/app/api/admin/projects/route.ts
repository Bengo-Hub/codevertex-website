import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';
import { photoSelect, serializeEvent } from '@/lib/projects';

const createSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(2),
  venue: z.string().min(2),
  description: z.string().min(1),
  eventDate: z.coerce.date(),
  published: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('projects', 'view'));
  if ('response' in guard) return guard.response;

  const events = await prisma.projectEvent.findMany({
    orderBy: { eventDate: 'desc' },
    include: { photos: { select: photoSelect, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] } },
  });
  return NextResponse.json(events.map(serializeEvent));
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('projects', 'manage'));
  if ('response' in guard) return guard.response;

  try {
    const data = createSchema.parse(await req.json());
    const event = await prisma.projectEvent.create({
      data,
      include: { photos: { select: photoSelect } },
    });
    return NextResponse.json(serializeEvent(event), { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: [{ message: 'An event with this slug already exists' }] }, { status: 409 });
    }
    console.error('[admin/projects POST]', err);
    return NextResponse.json({ error: [{ message: 'Failed to create event' }] }, { status: 500 });
  }
}
