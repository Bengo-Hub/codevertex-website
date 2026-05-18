import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendEnrollmentConfirmation } from '@/lib/notifications';
import { publishEnrollmentConfirmed } from '@/lib/events';
import { checkSpam } from '@/lib/spam-guard';

const TREASURY_API_URL =
  process.env.TREASURY_API_URL ?? 'https://treasury.codevertexitsolutions.com';
const TREASURY_TENANT =
  process.env.NEXT_PUBLIC_TREASURY_TENANT ?? 'codevertex';
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://codevertexitsolutions.com';

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
  try {
    const res = await fetch(
      `${TREASURY_API_URL}/api/v1/pay/${TREASURY_TENANT}/intents`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
  firstPaymentAmount: z.number(),
  discountRuleId: z.string().optional(),
  discountCode: z.string().optional(),
  discountPct: z.number().int().optional(),
  discountAmount: z.number().int().optional(),
  installments: z
    .array(
      z.object({
        installmentNo: z.number(),
        amount: z.number(),
        label: z.string(),
        dueDate: z.string(),
      })
    )
    .optional(),
});

function generateStudentId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'DGT-';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

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

    // 0. Validate cohort: capacity + registration window
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

    // 1. Upsert student user — one record per unique email
    let studentUser = await prisma.studentUser.findUnique({
      where: { email: data.email },
    });

    if (!studentUser) {
      let studentId = generateStudentId();
      let attempts = 0;
      while (attempts < 5) {
        const collision = await prisma.studentUser.findUnique({ where: { id: studentId } });
        if (!collision) break;
        studentId = generateStudentId();
        attempts++;
      }
      studentUser = await prisma.studentUser.create({
        data: {
          id: studentId,
          email: data.email,
          fullName: data.fullName,
          phone: data.phone,
          dob: data.dob ? new Date(data.dob) : null,
        },
      });
    }

    // 2. Create enrollment (amount = first payment only)
    const enrollment = await prisma.enrollment.create({
      data: {
        courseId: data.courseId,
        courseName: data.courseName,
        category: data.category,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        dob: data.dob ? new Date(data.dob) : null,
        experience: data.experience ?? null,
        howHeard: data.howHeard ?? null,
        amount: data.firstPaymentAmount,
        totalAmount: data.totalAmount,
        currency: data.currency,
        paymentPlan: data.paymentPlan,
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

    // 3. Create installment schedule rows
    if (data.installments && data.installments.length > 0) {
      await prisma.installmentSchedule.createMany({
        data: data.installments.map((inst) => ({
          enrollmentId: enrollment.id,
          installmentNo: inst.installmentNo,
          amount: inst.amount,
          currency: data.currency,
          dueDate: new Date(inst.dueDate),
          status: 'pending',
        })),
      });
    }

    // 4. Unique invoice ref — DGT-{enrollmentId}-DGT-{studentId} parsed by treasury webhook
    const invoiceRef = `DGT-${enrollmentId}-DGT-${studentUser.id}`;
    const remainingBalance = data.totalAmount - data.firstPaymentAmount;

    // 5. Pre-create treasury payment intent so Paystack's success redirect goes directly to
    //    our /digitika/success page (not via treasury-ui's intermediate success page).
    const successUrl = `${SITE_URL}/digitika/success`;
    const isInstallment = data.installments && data.installments.length > 1;
    const intentDescription = isInstallment
      ? `${data.courseName} — Installment 1 of ${data.installments!.length}`
      : data.courseName;

    const treasuryIntent = await createTreasuryIntent({
      invoiceRef,
      amount: data.firstPaymentAmount,
      currency: data.currency,
      description: `Digitika — ${intentDescription}`,
      customerEmail: data.email,
      returnUrl: successUrl,
      requestId,
    });

    // Build portal link for email
    const portalLink = `${SITE_URL}/digitika/success?reference=${invoiceRef}`;

    // Build installments summary for email
    const installmentsSummary = data.installments && data.installments.length > 1
      ? data.installments
          .map((i) => `${i.label}: ${data.currency} ${i.amount.toLocaleString()} (due ${i.dueDate})`)
          .join(' • ')
      : '';

    // 6. Publish domain event to NATS (consumed by notifications-api digitika_consumer)
    //    and send HTTP notification as fallback/supplement
    const enrollmentEventData = {
      enrollmentId,
      studentId: studentUser.id,
      studentName: data.fullName,
      studentEmail: data.email,
      courseName: data.courseName,
      courseCategory: data.category,
      paymentPlan: data.paymentPlan,
      totalAmount: data.totalAmount,
      firstPaymentAmount: data.firstPaymentAmount,
      currency: data.currency,
      portalLink,
      installmentsSummary,
      tenantId: 'codevertex',
    };
    publishEnrollmentConfirmed(enrollmentEventData).catch(() => {});

    // HTTP fallback: only call when NATS is not configured (digitika_consumer handles email when NATS is active)
    if (!process.env.EVENTS_NATS_URL) {
      sendEnrollmentConfirmation({
        studentName: data.fullName,
        studentEmail: data.email,
        courseName: data.courseName,
        courseCategory: data.category,
        paymentPlan: data.paymentPlan,
        firstPaymentAmount: data.firstPaymentAmount,
        totalAmount: data.totalAmount,
        currency: data.currency,
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
        enrollmentId,
        studentId: studentUser.id,
        invoiceRef,
        firstPaymentAmount: data.firstPaymentAmount,
        totalAmount: data.totalAmount,
        remainingBalance,
        currency: data.currency,
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
