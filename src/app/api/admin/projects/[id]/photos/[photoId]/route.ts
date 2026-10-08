import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('projects', 'view'));
  if ('response' in guard) return guard.response;

  const { id, photoId } = await params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(photoId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const photo = await prisma.projectPhoto.findFirst({
    where: { id: BigInt(photoId), eventId: BigInt(id) },
    select: { data: true, mimeType: true },
  });
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return new NextResponse(new Uint8Array(photo.data), {
    headers: { 'Content-Type': photo.mimeType, 'Cache-Control': 'private, max-age=300', 'X-Content-Type-Options': 'nosniff' },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('projects', 'manage'));
  if ('response' in guard) return guard.response;

  const { id, photoId } = await params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(photoId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // eventId in the filter stops an id from one event deleting a photo of another.
  const { count } = await prisma.projectPhoto.deleteMany({ where: { id: BigInt(photoId), eventId: BigInt(id) } });
  if (count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
