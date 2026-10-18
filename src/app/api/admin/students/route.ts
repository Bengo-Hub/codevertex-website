import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';
import { findStudentByEmail, upsertStudentUser } from '@/lib/enrollment-helpers';
import { contactProblem, guardianProblem, isUnder18 } from '@/lib/learner-rules';

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('students', 'view'));
  if ('response' in guard) return guard.response;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10));
  const search = url.searchParams.get('search') ?? undefined;

  const where = search
    ? {
        OR: [
          { id: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { fullName: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [total, items] = await Promise.all([
    prisma.studentUser.count({ where }),
    prisma.studentUser.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { enrollments: true } },
        // Which courses the student is already in, so the admin enrollment form can flag them.
        enrollments: {
          select: { courseId: true, courseName: true, paymentStatus: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pages: Math.ceil(total / limit),
    items,
  });
}

const createSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().max(32).optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  guardianName: z.string().trim().max(120).optional(),
  guardianEmail: z.string().trim().email().optional().or(z.literal('')),
  guardianPhone: z.string().trim().max(32).optional(),
});

/** Registers a student without enrolling them; enrol them in a course afterwards. */
export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('students', 'manage'));
  if ('response' in guard) return guard.response;

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Check the student details.' }, { status: 400 });
  }
  const d = parsed.data;
  const dob = d.dob || undefined;
  const minor = isUnder18(dob);
  const issue =
    contactProblem(minor, d.email, d.phone) ||
    guardianProblem(d.email ?? '', minor, { name: d.guardianName, email: d.guardianEmail });
  if (issue) return NextResponse.json({ error: issue }, { status: 400 });

  if (d.email && (await findStudentByEmail(d.email))) {
    return NextResponse.json({ error: 'A student with this email already exists.' }, { status: 409 });
  }
  const student = await upsertStudentUser({
    email: d.email || undefined,
    fullName: d.fullName,
    phone: d.phone,
    dob,
    guardian: d.guardianEmail
      ? { name: d.guardianName ?? '', email: d.guardianEmail.toLowerCase(), phone: d.guardianPhone ?? '' }
      : undefined,
  });
  return NextResponse.json(student, { status: 201 });
}
