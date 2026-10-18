import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';
import { findStudentByEmail } from '@/lib/enrollment-helpers';
import {
  contactProblem,
  guardianProblem,
  isPlaceholderEmail,
  isUnder18,
  placeholderEmail,
} from '@/lib/learner-rules';

type Ctx = { params: Promise<{ studentId: string }> };

const idOf = (raw: string) => raw.trim().toUpperCase();

export async function GET(req: NextRequest, { params }: Ctx) {
  const guard = await requirePermission(req, digitikaPerm('students', 'view'));
  if ('response' in guard) return guard.response;

  const student = await prisma.studentUser.findUnique({
    where: { id: idOf((await params).studentId) },
    include: {
      enrollments: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, courseId: true, courseName: true, paymentStatus: true, amount: true, totalAmount: true, currency: true, createdAt: true },
      },
      certificates: { select: { id: true, certificateNumber: true, courseName: true, revoked: true } },
    },
  });
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    ...student,
    enrollments: student.enrollments.map((e) => ({ ...e, id: e.id.toString() })),
  });
}

const patchSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().max(32).optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  guardianName: z.string().trim().max(120).optional(),
  guardianEmail: z.string().trim().email().optional().or(z.literal('')),
  guardianPhone: z.string().trim().max(32).optional(),
});

/**
 * Edits a student's details. The name, phone and email are copied onto their enrollments (which
 * keep a snapshot), so they stay in step. A student who already has a sign-in account keeps
 * their email: the account is linked by it, and changing it here would orphan the account.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const guard = await requirePermission(req, digitikaPerm('students', 'manage'));
  if ('response' in guard) return guard.response;

  const id = idOf((await params).studentId);
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Check the student details.' }, { status: 400 });
  }
  const d = parsed.data;
  const current = await prisma.studentUser.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const fullName = d.fullName ?? current.fullName;
  const phone = d.phone !== undefined ? d.phone : current.phone;
  const dobIso = d.dob !== undefined ? d.dob || undefined : current.dob?.toISOString().slice(0, 10);
  const guardianEmail = d.guardianEmail !== undefined ? d.guardianEmail.toLowerCase() : current.guardianEmail ?? '';
  const guardianName = d.guardianName !== undefined ? d.guardianName : current.guardianName ?? '';
  const guardianPhone = d.guardianPhone !== undefined ? d.guardianPhone : current.guardianPhone ?? '';

  // An emptied email on a child goes back to the placeholder; an adult must keep one.
  let email = current.email;
  if (d.email !== undefined) {
    const typed = d.email.toLowerCase();
    email = typed || (isPlaceholderEmail(current.email) ? current.email : placeholderEmail(current.id));
  }
  const emailChanged = email !== current.email;
  if (emailChanged && current.ssoUserId) {
    return NextResponse.json(
      { error: 'This student already has a sign-in account tied to their email, so the email cannot be changed here.' },
      { status: 409 },
    );
  }
  if (emailChanged && !isPlaceholderEmail(email)) {
    const clash = await findStudentByEmail(email);
    if (clash && clash.id !== id) return NextResponse.json({ error: 'Another student already uses this email.' }, { status: 409 });
  }

  const minor = isUnder18(dobIso);
  const own = isPlaceholderEmail(email) ? '' : email;
  const issue =
    contactProblem(minor, own, phone) ||
    guardianProblem(own, minor, { name: guardianName, email: guardianEmail });
  if (issue) return NextResponse.json({ error: issue }, { status: 400 });

  const guardianChanged = guardianEmail !== (current.guardianEmail ?? '');
  const updated = await prisma.$transaction(async (tx) => {
    const student = await tx.studentUser.update({
      where: { id },
      data: {
        fullName,
        email,
        phone,
        dob: dobIso ? new Date(dobIso) : null,
        guardianName: guardianName || null,
        guardianEmail: guardianEmail || null,
        guardianPhone: guardianPhone || null,
        // A different guardian needs their own parent account.
        ...(guardianChanged ? { guardianSsoUserId: null } : {}),
      },
    });
    await tx.enrollment.updateMany({
      where: { studentUserId: id },
      data: { fullName, email, phone, dob: dobIso ? new Date(dobIso) : null },
    });
    return student;
  });
  return NextResponse.json(updated);
}

/**
 * Deletes a student with no enrollments (a registration made by mistake). A student who has
 * enrolled keeps their record: delete or cancel the enrollments first, so payment history is
 * never orphaned. Their sign-in account, if any, lives in auth-api and is managed there.
 */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const guard = await requirePermission(req, digitikaPerm('students', 'manage'));
  if ('response' in guard) return guard.response;

  const id = idOf((await params).studentId);
  const student = await prisma.studentUser.findUnique({
    where: { id },
    select: { id: true, _count: { select: { enrollments: true, certificates: true } } },
  });
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (student._count.enrollments > 0) {
    return NextResponse.json(
      { error: `This student has ${student._count.enrollments} enrollment(s). Delete those first (only possible when no money was received), so payment history is kept.` },
      { status: 409 },
    );
  }
  await prisma.studentUser.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
