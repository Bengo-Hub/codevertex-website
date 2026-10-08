import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Public image endpoint. Only photos of PUBLISHED events are served, so unpublished
// drafts never leak by guessing ids.
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ photoId: string }> }) {
  const { photoId } = await params;
  if (!/^\d+$/.test(photoId)) return new NextResponse('Not found', { status: 404 });

  const photo = await prisma.projectPhoto.findFirst({
    where: { id: BigInt(photoId), event: { published: true } },
    select: { data: true, mimeType: true },
  });
  if (!photo) return new NextResponse('Not found', { status: 404 });

  return new NextResponse(new Uint8Array(photo.data), {
    headers: {
      'Content-Type': photo.mimeType,
      // A photo's bytes never change once uploaded (edits = delete + re-upload = new id).
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
