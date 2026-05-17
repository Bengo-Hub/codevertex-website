import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendEnrollmentConfirmation } from '@/lib/notifications';
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
}): Promise<{ initiateUrl: string } | null> {
  try {
    const res = await fetch(
      `${TREASURY_API_URL}/api/v1/pay/${TREASURY_TENANT}/intents`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const spamCheck = checkSpam({ name: data.fullName, email: data.email });
    if (spamCheck.blocked) {
      return NextResponse.json({ error: 'Submission blocked' }, { status: 422 });
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

    // 4. Unique invoice ref — enrollmentId + studentId prevents collision across same course/cohort
    const invoiceRef = `DGT-${enrollmentId}-${studentUser.id}`;
    const remainingBalance = data.totalAmount - data.firstPaymentAmount;

    // 5. Pre-create treasury payment intent so Paystack's success redirect goes directly to
    //    our /digitika/success page (not via treasury-ui's intermediate success page).
    const successUrl = `${SITE_URL}/digitika/success?reference_id=${invoiceRef}`;
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
    });

    // 6. Send confirmation email (fire and forget)
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
      installments: data.installments,
    }).catch((err) => console.error('[enrollment] notification error:', err));

    return NextResponse.json({
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
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error('[enrollments]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
