import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

const patchSchema = z.object({
  slug: z.string().min(2).optional(),
  title: z.string().min(2).optional(),
  venue: z.string().min(2).optional(),
  description: z.string().min(1).optional(),
  eventDate: z.coerce.date().optional(),
  published: z.boolean().optional(),
});

function parseId(id: string): bigint | null {
  return /^\d+$/.test(id) ? BigInt(id) : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission(req, digitikaPerm('projects', 'manage'));
  if ('response' in guard) return guard.response;

  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const data = patchSchema.parse(await req.json());
    const event = await prisma.projectEvent.update({
      where: { id },
      data,
      select: { id: true, slug: true, published: true },
    });
    return NextResponse.json({ ...event, id: event.id.toString() });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    const code = err instanceof Error && 'code' in err ? (err as { code: string }).code : null;
    if (code === 'P2002') return NextResponse.json({ error: [{ message: 'An event with this slug already exists' }] }, { status: 409 });
    if (code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    console.error('[admin/projects PATCH]', err);
    return NextResponse.json({ error: [{ message: 'Failed to update event' }] }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission(req, digitikaPerm('projects', 'manage'));
  if ('response' in guard) return guard.response;

  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    await prisma.projectEvent.delete({ where: { id } }); // photos cascade
    return NextResponse.json({ ok: true });
  } catch (err) {
    const code = err instanceof Error && 'code' in err ? (err as { code: string }).code : null;
    if (code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    console.error('[admin/projects DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
