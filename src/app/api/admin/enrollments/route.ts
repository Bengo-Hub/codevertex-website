import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';
import { upsertStudentUser, hasActiveEnrollment } from '@/lib/enrollment-helpers';
import { sendEnrollmentConfirmation } from '@/lib/notifications';
import { publishEnrollmentConfirmed } from '@/lib/events';
import { findCourse, computeDueDates } from '@/config/courses';

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
  courseId: z.string(),
  cohortId: z.string().optional(),
  // Defaults to the course's list price if omitted.
  totalAmount: z.number().int().min(0).optional(),
  paymentPlan: z.string().default('upfront'),
  // Admin already collected payment out-of-band (cash, bank transfer, etc.) — mark it paid now.
  markAsPaid: z.boolean().default(false),
  notes: z.string().optional(),
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

    if (!data.studentId && (!data.fullName || !data.email || !data.phone)) {
      return NextResponse.json(
        { error: 'Provide an existing studentId, or fullName + email + phone to create a new student.' },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({ where: { id: data.courseId } });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    // Category display name lives in static config (COURSE_CATEGORIES), not the DB row —
    // same lookup the public checkout flow relies on.
    const categoryName = findCourse(data.courseId)?.category.name ?? course.categoryId;

    // Resolve the student: either look up the existing one by public ID, or upsert by email.
    let studentUser;
    if (data.studentId) {
      studentUser = await prisma.studentUser.findUnique({ where: { id: data.studentId.trim().toUpperCase() } });
      if (!studentUser) {
        return NextResponse.json({ error: `No student found with ID ${data.studentId}` }, { status: 404 });
      }
    } else {
      studentUser = await upsertStudentUser({
        email: data.email!,
        fullName: data.fullName!,
        phone: data.phone!,
      });
    }

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
    const paymentStatus = data.markAsPaid || isFree ? 'succeeded' : 'pending';
    // A manually-paid or free enrollment has nothing outstanding, so "first payment"
    // is recorded as the full amount; a pending enrollment still records the full
    // total owed (admin can add an installment schedule via PATCH later if needed).
    const amount = totalAmount;

    const enrollment = await prisma.enrollment.create({
      data: {
        courseId: course.id,
        courseName: course.name,
        category: categoryName,
        fullName: studentUser.fullName,
        email: studentUser.email,
        phone: studentUser.phone,
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

 
    // Create InstallmentSchedule rows to match paymentPlan —  mirrors the public
    // checkout flow (POST /api/enrollments), which does this from course.installmentPlans
    // via the same computeDueDates() helper. Without this, an admin-created
    // installment enrollment has paymentPlan set but zero real installment rows,
    // which breaks progress display, the "Pay Now" block, and the reminder cron.
    if (!isFree && !data.markAsPaid && data.paymentPlan !== 'upfront') {
      const planSlug = data.paymentPlan;
      const matchedPlan = findCourse(data.courseId)?.course.installmentPlans?.find(
        (p) => p.label.toLowerCase().replace(/\s+/g, '-') === planSlug
      );
      if (matchedPlan) {
        const dueDates = computeDueDates(matchedPlan);
        // Scale the plan's stock amounts proportionally if the admin overrode totalAmount
        const scale = totalAmount / matchedPlan.totalAmount;
        await prisma.installmentSchedule.createMany({
          data: matchedPlan.payments.map((p, i) => ({
            enrollmentId: enrollment.id,
            installmentNo: i + 1,
            amount: Math.round(p.amount * scale),
            currency: course.currency,
            dueDate: dueDates[i],
            status: 'pending',
          })),
        });
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
      studentEmail: studentUser.email,
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
          studentEmail: studentUser.email,
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
      paymentStatus,
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
