import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const createSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  name: z.string(),
  shortName: z.string().optional(),
  slug: z.string(),
  duration: z.string(),
  mode: z.string(),
  price: z.number(),
  currency: z.string().default('KES'),
  description: z.string(),
  longDescription: z.string().optional(),
  level: z.string().default('beginner'),
  audience: z.string().optional(),
  stack: z.string().optional(),
  outcomes: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  careerPaths: z.array(z.string()).default([]),
  includes: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

export async function GET(req: NextRequest) {
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
  const body = await req.json();
  const data = createSchema.parse(body);

  const course = await prisma.course.create({ data });
  return NextResponse.json(course, { status: 201 });
}
