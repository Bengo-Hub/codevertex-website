import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendEnrollmentConfirmation } from '@/lib/notifications';
import { publishEnrollmentConfirmed } from '@/lib/events';
import { checkSpam } from '@/lib/spam-guard';
import { upsertStudentUser, hasActiveEnrollment, isUnder18 } from '@/lib/enrollment-helpers';
import { coursePolicy, resolveSchedule, scheduleSummary } from '@/lib/installments';
import { provisionEnrollmentAccounts } from '@/lib/portal-accounts';
import type { InstallmentPlan } from '@/types/course';

const TREASURY_API_URL =
  process.env.TREASURY_API_URL ?? 'https://booksapi.codevertexafrica.com';
const TREASURY_TENANT =
  process.env.NEXT_PUBLIC_TREASURY_TENANT ?? 'codevertex';
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://codevertexafrica.com';
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY ?? '';

// Pre-create a treasury payment intent so the success URL goes directly to our
// /digitika/success page (bypasses treasury-ui's own success page wrapper).
async function createTreasuryIntent(opts: {
  invoiceRef: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  returnUrl: string;
  requestId?: string;
}): Promise<{ initiateUrl: string } | null> {
  if (!INTERNAL_SERVICE_KEY) {
    console.warn('[enrollments] INTERNAL_SERVICE_KEY not set — skipping treasury intent pre-creation');
    return null;
  }
  try {
    const res = await fetch(
      `${TREASURY_API_URL}/api/v1/pay/${TREASURY_TENANT}/intents`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': INTERNAL_SERVICE_KEY,
          'X-Request-ID': opts.requestId ?? crypto.randomUUID(),
        },
        body: JSON.stringify({
          reference_id: opts.invoiceRef,
          reference_type: 'digitika_enrollment',
          amount: opts.amount,
          currency: opts.currency,
          description: opts.description,
          customer_email: opts.customerEmail,
          source_service: 'codevertex-website',
          return_url: opts.returnUrl,
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.initiate_url ? { initiateUrl: data.initiate_url as string } : null;
  } catch {
    return null;
  }
}

const schema = z.object({
  courseId: z.string(),
  courseName: z.string(),
  category: z.string(),
  cohortId: z.string().optional(),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(9),
  dob: z.string().optional(),
  experience: z.string().optional(),
  howHeard: z.string().optional(),
  totalAmount: z.number(),
  currency: z.string().default('KES'),
  paymentPlan: z.string().default('upfront'),
  // A plan the learner built: their deposit and how many payments in all. Only honoured
  // within the course's InstallmentPolicy.
  customPlan: z.object({ deposit: z.number().int(), count: z.number().int() }).optional(),
  discountRuleId: z.string().optional(),
  discountCode: z.string().optional(),
  discountPct: z.number().int().optional(),
  discountAmount: z.number().int().optional(),
  // Parent or guardian, required when the learner is under 18.
  guardianName: z.string().trim().max(120).optional(),
  guardianEmail: z.string().trim().email().optional().or(z.literal('')),
  guardianPhone: z.string().trim().max(32).optional(),
  // Older clients still send these; the server builds the schedule itself and ignores them.
  firstPaymentAmount: z.number().optional(),
  installments: z.array(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {

  // Propagate or generate a request ID for distributed tracing (matches httpware X-Request-ID pattern)
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const spamCheck = checkSpam({ name: data.fullName, email: data.email });
    if (spamCheck.blocked) {
      return NextResponse.json({ error: 'Submission blocked' }, { status: 422 });
    }

    // 0a. Enrollment check: block re-enrolling in a course the student is already
    // confirmed (paid/succeeded) in, instead of silently creating a duplicate row.
    const alreadyEnrolled = await hasActiveEnrollment(data.email, data.courseId);
    if (alreadyEnrolled) {
      return NextResponse.json(
        { error: 'You already have an active enrollment in this course. Check your student dashboard.' },
        { status: 409 }
      );
    }

    // 0b. Validate cohort: capacity + registration window
    if (data.cohortId) {
      const cohort = await prisma.cohort.findUnique({
        where: { id: BigInt(data.cohortId) },
        include: { _count: { select: { enrollments: true } } },
      });
      if (!cohort) {
        return NextResponse.json({ error: 'Selected cohort not found' }, { status: 400 });
      }
      if (cohort.status !== 'open') {
        return NextResponse.json({ error: 'This cohort is no longer open for enrollment' }, { status: 400 });
      }
      if (cohort._count.enrollments >= cohort.maxSlots) {
        return NextResponse.json({ error: 'This cohort is fully booked' }, { status: 409 });
      }
      // Check registration window
      const now = new Date();
      if (cohort.registrationFrom && now < cohort.registrationFrom) {
        return NextResponse.json({ error: 'Registration for this cohort has not opened yet' }, { status: 400 });
      }
      if (cohort.registrationUntil) {
        const effectiveDeadline = new Date(
          cohort.registrationUntil.getTime() + cohort.registrationExtDays * 86_400_000
        );
        if (now > effectiveDeadline) {
          return NextResponse.json({ error: 'Registration deadline for this cohort has passed' }, { status: 400 });
        }
      }
    }

      // 0c. Server-side price validation: never trust client-supplied totalAmount/
    // firstPaymentAmount. Look up the course's real price and, if a discount was
    // applied, recompute the discounted price the same way /api/discounts/validate
    // does — then require the client's totals to match exactly.
    const course = await prisma.course.findUnique({
      where: { id: data.courseId, isActive: true },
      select: {
        name: true,
        price: true,
        currency: true,
        installmentsEnabled: true,
        installmentPlans: true,
        metadata: true,
      },
    });
    if (!course) {
      return NextResponse.json({ error: 'Course not found or not available' }, { status: 400 });
    }

    let canonicalTotal = course.price;

    if (data.discountRuleId || data.discountCode) {
      const rule = data.discountRuleId
        ? await prisma.discountRule.findUnique({
            where: { id: BigInt(data.discountRuleId) },
            include: { _count: { select: { enrollments: true } } },
          })
        : await prisma.discountRule.findUnique({
            where: { code: (data.discountCode ?? '').toUpperCase() },
            include: { _count: { select: { enrollments: true } } },
          });

      if (!rule || !rule.active) {
        return NextResponse.json({ error: 'Invalid or expired discount code' }, { status: 400 });
      }
      const now = new Date();
      if (rule.validFrom && now < rule.validFrom) {
        return NextResponse.json({ error: 'Discount code is not yet active' }, { status: 400 });
      }
      if (rule.validUntil && now > rule.validUntil) {
        return NextResponse.json({ error: 'Discount code has expired' }, { status: 400 });
      }
      if (rule.courseId && rule.courseId !== data.courseId) {
        return NextResponse.json({ error: 'Discount code does not apply to this course' }, { status: 400 });
      }
      if (rule.maxUses != null && rule._count.enrollments >= rule.maxUses) {
        return NextResponse.json({ error: 'Discount code has reached its usage limit' }, { status: 409 });
      }

      canonicalTotal =
        rule.discountPct != null
          ? Math.round(course.price * (1 - rule.discountPct / 100))
          : rule.discountAmount != null
          ? Math.max(0, course.price - rule.discountAmount)
          : course.price;
    }

      if (data.totalAmount !== canonicalTotal) {
      return NextResponse.json(
        { error: 'Price mismatch — please refresh and try again.' },
        { status: 400 }
      );
    }

    // 0d. The schedule comes from the course's own plans and policy, never from the browser:
    // a client could otherwise send "1 shilling now, the rest next year".
    const schedule = resolveSchedule({
      plans: (Array.isArray(course.installmentPlans) ? course.installmentPlans : []) as unknown as InstallmentPlan[],
      installmentsEnabled: course.installmentsEnabled,
      policy: coursePolicy(course.metadata),
      total: canonicalTotal,
      currency: course.currency,
      paymentPlan: data.paymentPlan,
      custom: data.customPlan,
    });
    if (!schedule.ok) {
      return NextResponse.json({ error: schedule.error }, { status: 400 });
    }
    const payments = schedule.payments;
    const firstPaymentAmount = payments[0]?.amount ?? 0;

    // 0e. Minors need a parent or guardian on record; the guardian gets a parent portal account.
    const guardianEmail = data.guardianEmail ? data.guardianEmail.toLowerCase() : '';
    if (isUnder18(data.dob) && (!data.guardianName || !guardianEmail)) {
      return NextResponse.json({ error: 'Learners under 18 need a parent or guardian name and email.' }, { status: 400 });
    }
    if (guardianEmail && guardianEmail === data.email.toLowerCase()) {
      return NextResponse.json({ error: "Use the parent or guardian's own email, not the learner's." }, { status: 400 });
    }

    // 1. Upsert student user, one record per unique email
    const studentUser = await upsertStudentUser({
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      dob: data.dob,
      guardian: guardianEmail
        ? { name: data.guardianName ?? '', email: guardianEmail, phone: data.guardianPhone ?? '' }
        : undefined,
    });

    // A course with a total price of 0 needs no payment step, so it is confirmed immediately.
    const isFree = canonicalTotal === 0;

    // 2. Create enrollment (amount = first payment only). Names, amounts and currency come
    // from the course row and the server-built schedule, not from the request.
    const enrollment = await prisma.enrollment.create({
      data: {
        courseId: data.courseId,
        courseName: course.name,
        category: data.category,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        dob: data.dob ? new Date(data.dob) : null,
        experience: data.experience ?? null,
        howHeard: data.howHeard ?? null,
        amount: firstPaymentAmount,
        totalAmount: canonicalTotal,
        currency: course.currency,
        paymentPlan: data.paymentPlan,
        paymentStatus: isFree ? 'succeeded' : 'pending',
        installmentNo: 1,
        studentUserId: studentUser.id,
        cohortId: data.cohortId ? BigInt(data.cohortId) : null,
        discountRuleId: data.discountRuleId ? BigInt(data.discountRuleId) : null,
        discountCode: data.discountCode ?? null,
        discountPct: data.discountPct ?? null,
        discountAmount: data.discountAmount ?? null,
      },
    });

    const enrollmentId = enrollment.id.toString();

    // 3. Installment schedule rows (none for free courses: nothing owed)
    if (!isFree && payments.length > 0) {
      await prisma.installmentSchedule.createMany({
        data: payments.map((p) => ({
          enrollmentId: enrollment.id,
          installmentNo: p.installmentNo,
          amount: p.amount,
          currency: course.currency,
          dueDate: p.dueDate,
          status: 'pending',
        })),
      });
    }

    // A free enrollment is confirmed now, so its portal accounts are due now. Paid ones get
    // theirs when the first payment clears (treasury subscriber).
    if (isFree) {
      provisionEnrollmentAccounts(enrollment.id, requestId).catch((err) =>
        console.error('[enrollments] portal account provisioning failed:', err)
      );
    }

    // 4. Unique invoice ref, DGT-{enrollmentId}-DGT-{studentId}, parsed by the treasury subscriber
    const invoiceRef = `DGT-${enrollmentId}-DGT-${studentUser.id}`;
    const remainingBalance = canonicalTotal - firstPaymentAmount;

    // 5. Pre-create the treasury payment intent so Paystack's success redirect lands on our
    //    /digitika/success page. Free courses skip it: nothing to pay.
    const successUrl = `${SITE_URL}/digitika/success`;
    const intentDescription = payments.length > 1
      ? `${course.name}, payment 1 of ${payments.length}`
      : course.name;

    const treasuryIntent = isFree
      ? null
      : await createTreasuryIntent({
          invoiceRef,
          amount: firstPaymentAmount,
          currency: course.currency,
          description: `Digitika: ${intentDescription}`,
          customerEmail: data.email,
          returnUrl: successUrl,
          requestId,
        });

    const portalLink = `${SITE_URL}/digitika/success?reference=${invoiceRef}`;
    const installmentsSummary = scheduleSummary(payments, course.currency);

    // 6. Domain event on NATS (notifications-api digitika_consumer sends the email); HTTP is
    //    the fallback when NATS is not configured.
    const enrollmentEventData = {
      enrollmentId,
      studentId: studentUser.id,
      studentName: data.fullName,
      studentEmail: data.email,
      courseName: course.name,
      courseCategory: data.category,
      paymentPlan: data.paymentPlan,
      totalAmount: canonicalTotal,
      firstPaymentAmount,
      currency: course.currency,
      portalLink,
      installmentsSummary,
      tenantId: 'codevertex',
    };
    publishEnrollmentConfirmed(enrollmentEventData).catch(() => {});

    if (!process.env.EVENTS_NATS_URL) {
      sendEnrollmentConfirmation({
        studentName: data.fullName,
        studentEmail: data.email,
        courseName: course.name,
        courseCategory: data.category,
        paymentPlan: data.paymentPlan,
        firstPaymentAmount,
        totalAmount: canonicalTotal,
        currency: course.currency,
        studentId: studentUser.id,
        enrollmentId,
        remainingBalance,
        portalLink,
        installmentsSummary,
      }, requestId).catch((err) => console.error('[enrollment] notification error:', err));
    }

    return NextResponse.json(
      {
        success: true,
        isFree,
        enrollmentId,
        studentId: studentUser.id,
        invoiceRef,
        firstPaymentAmount,
        totalAmount: canonicalTotal,
        remainingBalance,
        currency: course.currency,
        installments: payments.map((p) => ({
          installmentNo: p.installmentNo,
          amount: p.amount,
          label: p.label,
          dueDate: p.dueDate.toISOString().split('T')[0],
        })),
        // If intent pre-creation succeeded, pass initiate_url so treasury-ui skips auto-create
        initiateUrl: treasuryIntent?.initiateUrl ?? null,
      },
      { headers: { 'X-Request-ID': requestId } }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error('[enrollments]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
