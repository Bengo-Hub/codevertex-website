import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';
import { summarizeEnrollmentPayments } from '@/lib/enrollment-helpers';
import {
  MANUAL_PAYMENT_METHODS,
  PaymentRejected,
  applyEnrollmentPayment,
  bookManualPaymentInTreasury,
  publishPaymentReceipt,
} from '@/lib/enrollment-payments';
import { provisionEnrollmentAccounts } from '@/lib/portal-accounts';

const bodySchema = z.object({
  amount: z.number().int().positive(),
  method: z.enum(MANUAL_PAYMENT_METHODS),
  // Bank slip / transaction number. Required: treasury refuses the same method and
  // reference twice, which is what stops one deposit being recorded twice.
  reference: z.string().trim().min(3).max(80),
  // Day the money arrived (YYYY-MM-DD); defaults to today. Never in the future.
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * POST /api/admin/enrollments/[id]/payments: record a payment made outside the website (bank
 * deposit, cash, cheque, M-Pesa straight to the till).
 *
 * Order matters: treasury books it first, so a deposit is never on the enrollment without
 * being in the books. Then the shared allocator applies it as the next installment and spreads
 * what is still owed over the remaining ones (src/lib/enrollment-payments.ts). The student
 * gets the usual receipt, and portal accounts if this was the first payment.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission(req, digitikaPerm('installments', 'manage'));
  if ('response' in guard) return guard.response;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Invalid enrollment' }, { status: 400 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid payment' }, { status: 400 });
  }
  const { amount, method, reference } = parsed.data;
  const paidAt = parsed.data.paidAt ? new Date(`${parsed.data.paidAt}T12:00:00Z`) : new Date();
  if (paidAt.getTime() > Date.now() + 86_400_000) {
    return NextResponse.json({ error: 'The payment date cannot be in the future.' }, { status: 400 });
  }

  const enrollmentId = BigInt(id);
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { installments: { orderBy: { installmentNo: 'asc' } } },
  });
  if (!enrollment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!enrollment.studentUserId) {
    return NextResponse.json({ error: 'This enrollment has no student record.' }, { status: 400 });
  }
  const { remainingBalance } = summarizeEnrollmentPayments(enrollment, enrollment.installments);
  if (remainingBalance <= 0) {
    return NextResponse.json({ error: 'This enrollment is already paid in full.' }, { status: 409 });
  }
  if (amount > remainingBalance) {
    return NextResponse.json(
      { error: `That is more than the balance of ${enrollment.currency} ${remainingBalance.toLocaleString()}.` },
      { status: 400 },
    );
  }

  const paymentRef = `${method}:${reference}`;
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();

  let booking;
  try {
    booking = await bookManualPaymentInTreasury({
      // The same receipt reference online payments carry, so treasury files it with them.
      accountRef: `DGT-${enrollment.id}-DGT-${enrollment.studentUserId}`,
      enrollmentId: enrollment.id.toString(),
      amount,
      currency: enrollment.currency,
      method,
      reference,
      payerName: enrollment.fullName,
      requestId,
    });
  } catch (err) {
    console.error('[admin-payment] treasury booking failed:', err);
    return NextResponse.json(
      { error: 'Treasury did not accept the payment, so nothing was recorded. Try again.' },
      { status: 502 },
    );
  }
  if (!booking.booked) {
    return NextResponse.json(
      { error: `A ${method.replace('_', ' ')} payment with reference ${reference} is already recorded.` },
      { status: 409 },
    );
  }

  try {
    const applied = await applyEnrollmentPayment(enrollmentId, amount, { paymentRef, paidAt, rejectOverpayment: true });
    publishPaymentReceipt(applied, paymentRef).catch((err) => console.error('[admin-payment] receipt event failed:', err));
    provisionEnrollmentAccounts(enrollmentId, requestId).catch((err) =>
      console.error('[admin-payment] portal account provisioning failed:', err)
    );
    return NextResponse.json({
      ok: true,
      treasuryIntentId: booking.intentId,
      installmentNo: applied.installmentNo,
      amountPaid: applied.amountPaid,
      remainingBalance: applied.remainingBalance,
    });
  } catch (err) {
    // Booked in treasury but not applied here (a concurrent payment cleared the balance first).
    // Treasury has the money, so say so plainly instead of hiding it.
    const reason = err instanceof PaymentRejected ? err.message : 'an internal error';
    console.error(`[admin-payment] enrollment ${id}: booked in treasury (${booking.intentId}) but not applied:`, err);
    return NextResponse.json(
      { error: `Treasury recorded the payment, but the schedule was not updated (${reason}). Ask finance to refund or move intent ${booking.intentId}.` },
      { status: 409 },
    );
  }
}
