import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

const createSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(2),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  author: z.string().min(1),
  coverImage: z.string().optional(),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  publishedAt: z.coerce.date().optional(),
});

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('blog', 'view'));
  if ('response' in guard) return guard.response;

  const url = new URL(req.url);
  const includeUnpublished = url.searchParams.get('includeUnpublished') === 'true';

  const posts = await prisma.blogPost.findMany({
    where: includeUnpublished ? {} : { published: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(posts.map((p) => ({ ...p, id: p.id.toString() })));
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('blog', 'manage'));
  if ('response' in guard) return guard.response;

  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const publishedAt = data.published ? (data.publishedAt ?? new Date()) : null;

    const post = await prisma.blogPost.create({ data: { ...data, publishedAt } });
    return NextResponse.json({ ...post, id: post.id.toString() }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: [{ message: 'A post with this slug already exists' }] }, { status: 409 });
    }
    console.error('[admin/blog POST]', err);
    return NextResponse.json({ error: [{ message: 'Failed to create post' }] }, { status: 500 });
  }
}
