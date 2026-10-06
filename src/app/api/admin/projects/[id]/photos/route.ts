import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

// Next route handlers have no small body cap, but reverse proxies often do — the admin form
// resizes in the browser (≈200–400 KB per photo) and sends ONE photo per request.
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_PHOTOS_PER_EVENT = 60;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission(req, digitikaPerm('projects', 'manage'));
  if ('response' in guard) return guard.response;

  const rawId = (await params).id;
  if (!/^\d+$/.test(rawId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const eventId = BigInt(rawId);

  const event = await prisma.projectEvent.findUnique({
    where: { id: eventId },
    select: { id: true, _count: { select: { photos: true } } },
  });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (event._count.photos >= MAX_PHOTOS_PER_EVENT) {
    return NextResponse.json({ error: `An event can have at most ${MAX_PHOTOS_PER_EVENT} photos` }, { status: 400 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file received' }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: 'Only JPG, PNG or WebP images are allowed' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Photo is larger than 4 MB' }, { status: 413 });

  const caption = form?.get('caption');
  const last = await prisma.projectPhoto.findFirst({
    where: { eventId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  const photo = await prisma.projectPhoto.create({
    data: {
      eventId,
      mimeType: file.type,
      data: new Uint8Array(await file.arrayBuffer()),
      caption: typeof caption === 'string' && caption.trim() ? caption.trim().slice(0, 200) : null,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
    select: { id: true, caption: true, sortOrder: true },
  });
  return NextResponse.json({ ...photo, id: photo.id.toString() }, { status: 201 });
}
