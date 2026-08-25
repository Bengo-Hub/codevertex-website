import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

const patchSchema = z.object({
  slug: z.string().min(2).optional(),
  title: z.string().min(2).optional(),
  excerpt: z.string().nullish(),
  content: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  coverImage: z.string().nullish(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
  publishedAt: z.coerce.date().nullish(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('blog', 'view'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id: BigInt(id) } });
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...post, id: post.id.toString() });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('blog', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

    if (data.published === true && data.publishedAt === undefined) {
      const existing = await prisma.blogPost.findUnique({ where: { id: BigInt(id) } });
      if (existing && !existing.publishedAt) {
        (data as { publishedAt?: Date }).publishedAt = new Date();
      }
    }

    const updated = await prisma.blogPost.update({ where: { id: BigInt(id) }, data });
    return NextResponse.json({ ...updated, id: updated.id.toString() });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: [{ message: 'A post with this slug already exists' }] }, { status: 409 });
    }
    console.error('[admin/blog PATCH]', err);
    return NextResponse.json({ error: [{ message: 'Failed to update post' }] }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(req, digitikaPerm('blog', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  await prisma.blogPost.delete({ where: { id: BigInt(id) } });
  return NextResponse.json({ ok: true });
}
