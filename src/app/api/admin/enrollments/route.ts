import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';
import { upsertStudentUser, hasActiveEnrollment, findStudentByEmail } from '@/lib/enrollment-helpers';
import { ageProblem, contactEmailOf, contactProblem, guardianProblem, isUnder18 } from '@/lib/learner-rules';
import { sendEnrollmentConfirmation } from '@/lib/notifications';
import { publishEnrollmentConfirmed } from '@/lib/events';
import { getCategory } from '@/config/courses';
import { coursePolicy, resolveSchedule } from '@/lib/installments';
import { provisionEnrollmentAccounts } from '@/lib/portal-accounts';
import { MANUAL_PAYMENT_METHODS, ManualPaymentError, recordManualPayment } from '@/lib/enrollment-payments';
import type { InstallmentPlan } from '@/types/course';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://codevertexafrica.com';

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('enrollments', 'view'));
  if ('response' in guard) return guard.response;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10));
  const status = url.searchParams.get('status') ?? undefined;
  const search = url.searchParams.get('search') ?? undefined;
  const courseId = url.searchParams.get('courseId') ?? undefined;

  const where = {
    ...(status ? { paymentStatus: status } : {}),
    ...(courseId ? { courseId } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { courseName: { contains: search, mode: 'insensitive' as const } },
            { studentUserId: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.enrollment.count({ where }),
    prisma.enrollment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        studentUser: { select: { id: true, email: true } },
        installments: { orderBy: { installmentNo: 'asc' } },
      },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pages: Math.ceil(total / limit),
    items: items.map((e) => ({
      ...e,
      id: e.id.toString(),
      cohortId: e.cohortId?.toString() ?? null,
      installments: e.installments.map((i) => ({
        ...i,
        id: i.id.toString(),
        enrollmentId: i.enrollmentId.toString(),
      })),
    })),
  });
}

const createSchema = z.object({
  // Either an existing student's public ID (DGT-XXXXXXXX)...
  studentId: z.string().optional(),
  // ...or enough details to create one on the spot.
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  // Date of birth (YYYY-MM-DD): needed for age-limited courses and to know who must have a guardian.
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  // Parent or guardian, required for a learner under 18. Replaces the one on record when given.
  guardianName: z.string().trim().max(120).optional(),
  guardianEmail: z.string().trim().email().optional().or(z.literal('')),
  guardianPhone: z.string().trim().max(32).optional(),
  experience: z.string().trim().max(80).optional(),
  howHeard: z.string().trim().max(80).optional(),
  courseId: z.string(),
  cohortId: z.string().optional(),
  // Defaults to the course's list price if omitted.
  totalAmount: z.number().int().min(0).optional(),
  paymentPlan: z.string().default('upfront'),
  // For paymentPlan "custom": the deposit and number of payments, within the course rules.
  customPlan: z.object({ deposit: z.number().int(), count: z.number().int() }).optional(),
  // Admin already collected payment out-of-band (cash, bank transfer, etc.): record it now.
  // It is booked in treasury like any payment, so how it was paid and the reference are required.
  markAsPaid: z.boolean().default(false),
  // What was actually collected; defaults to the first installment (or the total on an upfront plan).
  paidAmount: z.number().int().min(1).optional(),
  paymentMethod: z.enum(MANUAL_PAYMENT_METHODS).optional(),
  paymentReference: z.string().trim().min(3).max(80).optional(),
  notes: z.string().optional(),
}).refine((d) => !d.markAsPaid || (d.paymentMethod && d.paymentReference), {
  message: 'Choose how it was paid and enter the bank slip or transaction reference.',
});

/**
 * Admin-side manual enrollment — for cash/offline payments, promotional free seats,
 * or onboarding a student the sales team enrolled by phone. Mirrors the public
 * /api/enrollments flow but skips the treasury/payment-gateway step entirely:
 * the admin either marks it paid immediately (payment already collected) or leaves
 * it pending (student pays their own installments later from their portal).
 */
export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('enrollments', 'manage'));
  if ('response' in guard) return guard.response;

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    if (!data.studentId && !data.fullName) {
      return NextResponse.json(
        { error: 'Provide an existing studentId, or the name of a new student (email and phone are optional for learners under 18).' },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({ where: { id: data.courseId } });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    const categoryName = getCategory(course.categoryId).name;

    // Resolve the student: either look up the existing one by public ID, or find or create by email.
    // The same age and guardian rules as public checkout are checked BEFORE anything is written.
    const existingStudent = data.studentId
      ? await prisma.studentUser.findUnique({ where: { id: data.studentId.trim().toUpperCase() } })
      : data.email
        ? await findStudentByEmail(data.email)
        : null;
    if (data.studentId && !existingStudent) {
      return NextResponse.json({ error: `No student found with ID ${data.studentId}` }, { status: 404 });
    }
    const learnerEmail = existingStudent?.email ?? data.email ?? '';
    const dobIso = existingStudent?.dob?.toISOString().slice(0, 10) ?? data.dob;
    // A new learner under 18 needs no email or phone of their own: the guardian is the contact.
    if (!existingStudent) {
      const contactIssue = contactProblem(isUnder18(dobIso), data.email, data.phone);
      if (contactIssue) return NextResponse.json({ error: contactIssue }, { status: 400 });
    }

    const ageIssue = ageProblem(dobIso, course.audience);
    if (ageIssue) return NextResponse.json({ error: ageIssue }, { status: 400 });

    // A guardian typed now wins; otherwise the one already on the student's record counts.
    const typedGuardianEmail = (data.guardianEmail ?? '').toLowerCase();
    const guardian = typedGuardianEmail
      ? { name: data.guardianName ?? '', email: typedGuardianEmail, phone: data.guardianPhone ?? '' }
      : existingStudent?.guardianEmail
        ? { name: existingStudent.guardianName ?? '', email: existingStudent.guardianEmail, phone: existingStudent.guardianPhone ?? '' }
        : undefined;
    const guardianIssue = guardianProblem(learnerEmail, isUnder18(dobIso), guardian);
    if (guardianIssue) return NextResponse.json({ error: guardianIssue }, { status: 400 });

    const studentUser = await upsertStudentUser({
      email: learnerEmail,
      fullName: existingStudent?.fullName ?? data.fullName!,
      phone: existingStudent?.phone ?? data.phone,
      dob: dobIso,
      guardian: typedGuardianEmail ? guardian : undefined,
    });

    // Enrollment check — same rule as the public flow: no duplicate confirmed enrollments.
    const alreadyEnrolled = await hasActiveEnrollment(studentUser.email, data.courseId);
    if (alreadyEnrolled) {
      return NextResponse.json(
        { error: `${studentUser.fullName} already has an active enrollment in this course.` },
        { status: 409 }
      );
    }

    if (data.cohortId) {
      const cohort = await prisma.cohort.findUnique({
        where: { id: BigInt(data.cohortId) },
        include: { _count: { select: { enrollments: true } } },
      });
      if (!cohort) {
        return NextResponse.json({ error: 'Selected cohort not found' }, { status: 400 });
      }
      if (cohort._count.enrollments >= cohort.maxSlots) {
        return NextResponse.json({ error: 'This cohort is fully booked' }, { status: 409 });
      }
    }

    const totalAmount = data.totalAmount ?? course.price;
    const isFree = totalAmount === 0;
    // Paid enrollments are confirmed by the payment itself (recordManualPayment below), never
    // typed in: only a free enrollment starts out succeeded.
    const paymentStatus = isFree ? 'succeeded' : 'pending';
    // A manually-paid or free enrollment has nothing outstanding, so "first payment"
    // is recorded as the full amount; a pending enrollment still records the full
    // total owed (admin can add an installment schedule via PATCH later if needed).
    let amount = totalAmount;

    const enrollment = await prisma.enrollment.create({
      data: {
        courseId: course.id,
        courseName: course.name,
        category: categoryName,
        fullName: studentUser.fullName,
        email: studentUser.email,
        phone: studentUser.phone,
        dob: studentUser.dob,
        experience: data.experience || null,
        howHeard: data.howHeard || null,
        amount,
        totalAmount,
        currency: course.currency,
        paymentPlan: data.paymentPlan,
        paymentStatus,
        installmentNo: 1,
        studentUserId: studentUser.id,
        cohortId: data.cohortId ? BigInt(data.cohortId) : null,
      },
    });

        const enrollmentId = enrollment.id.toString();

 
    // Installment rows for a pending plan, built from the course's own plans and custom-plan
    // rules by the same builder as public checkout (src/lib/installments.ts).
    // Built whether or not a payment was already collected: the collected money is applied to
    // the first installment, never to the whole total.
    if (!isFree && data.paymentPlan !== 'upfront') {
      const schedule = resolveSchedule({
        plans: (Array.isArray(course.installmentPlans) ? course.installmentPlans : []) as unknown as InstallmentPlan[],
        installmentsEnabled: course.installmentsEnabled,
        policy: coursePolicy(course.metadata),
        total: totalAmount,
        currency: course.currency,
        paymentPlan: data.paymentPlan,
        custom: data.customPlan,
      });
      if (!schedule.ok) {
        // Roll back the enrollment rather than leave one with no schedule behind it.
        await prisma.enrollment.delete({ where: { id: enrollment.id } });
        return NextResponse.json({ error: schedule.error }, { status: 400 });
      }
      await prisma.installmentSchedule.createMany({
        data: schedule.payments.map((p) => ({
          enrollmentId: enrollment.id,
          installmentNo: p.installmentNo,
          amount: p.amount,
          currency: course.currency,
          dueDate: p.dueDate,
          status: 'pending',
        })),
      });
      amount = schedule.payments[0]?.amount ?? totalAmount;
      await prisma.enrollment.update({ where: { id: enrollment.id }, data: { amount } });
    }

    if (isFree) {
      provisionEnrollmentAccounts(enrollment.id).catch((err) =>
        console.error('[admin-enrollment] portal account provisioning failed:', err)
      );
    }

    // "Mark as paid": book what was collected in treasury (the first installment unless the
    // admin entered another amount), then apply it (which confirms the enrollment and creates
    // the portal accounts). If treasury refuses, undo the enrollment so nothing is left
    // half-recorded.
    if (data.markAsPaid && !isFree) {
      const collected = data.paidAmount ?? amount;
      if (collected > totalAmount) {
        await prisma.installmentSchedule.deleteMany({ where: { enrollmentId: enrollment.id } });
        await prisma.enrollment.delete({ where: { id: enrollment.id } });
        return NextResponse.json({ error: 'The amount collected is more than the total.' }, { status: 400 });
      }
      try {
        await recordManualPayment({
          enrollmentId: enrollment.id,
          amount: collected,
          method: data.paymentMethod!,
          reference: data.paymentReference!,
          requestId: crypto.randomUUID(),
          skipReceipt: true, // the enrollment confirmation below already tells the student
        });
      } catch (err) {
        await prisma.installmentSchedule.deleteMany({ where: { enrollmentId: enrollment.id } });
        await prisma.enrollment.delete({ where: { id: enrollment.id } });
        if (err instanceof ManualPaymentError) return NextResponse.json({ error: err.message }, { status: err.status });
        throw err;
      }
    }

    const invoiceRef = `DGT-${enrollmentId}-DGT-${studentUser.id}`;
    const portalLink = `${SITE_URL}/digitika/success?reference=${invoiceRef}`;

    // Same notification path as self-serve enrollment, so the student gets a consistent email
    // either way (portal link, student ID, etc.) regardless of who created the enrollment.
    const enrollmentEventData = {
      enrollmentId,
      studentId: studentUser.id,
      studentName: studentUser.fullName,
      studentEmail: contactEmailOf(studentUser.email, studentUser.guardianEmail),
      courseName: course.name,
      courseCategory: categoryName,
      paymentPlan: data.paymentPlan,
      totalAmount,
      firstPaymentAmount: amount,
      currency: course.currency,
      portalLink,
      installmentsSummary: '',
      tenantId: 'codevertex',
    };
    publishEnrollmentConfirmed(enrollmentEventData).catch(() => {});

    if (!process.env.EVENTS_NATS_URL) {
      sendEnrollmentConfirmation(
        {
          studentName: studentUser.fullName,
          studentEmail: contactEmailOf(studentUser.email, studentUser.guardianEmail),
          courseName: course.name,
          courseCategory: categoryName,
          paymentPlan: data.paymentPlan,
          firstPaymentAmount: amount,
          totalAmount,
          currency: course.currency,
          studentId: studentUser.id,
          enrollmentId,
          remainingBalance: totalAmount - amount,
          portalLink,
          installmentsSummary: '',
        },
        crypto.randomUUID()
      ).catch((err) => console.error('[admin-enrollment] notification error:', err));
    }

    return NextResponse.json({
      success: true,
      enrollmentId,
      studentId: studentUser.id,
      paymentStatus: data.markAsPaid && !isFree ? 'succeeded' : paymentStatus,
      invoiceRef,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error('[admin-enrollments]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
