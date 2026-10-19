/**
 * Applying money received to an enrollment's installment schedule. One allocator for every
 * way a payment arrives: treasury's payment.succeeded event (Paystack, M-Pesa through the
 * hosted page) and a deposit an admin records by hand (bank transfer, cash, cheque, M-Pesa
 * sent straight to the till).
 *
 * The payment becomes the next unpaid installment, at the amount actually received. What is
 * still owed (total minus everything paid) is then spread over the remaining unpaid
 * installments, keeping their due dates:
 *   - paid less than due: the shortfall moves onto the later installments, or onto a new one
 *     on the same due date when nothing is left after it
 *   - paid more than due: the later installments shrink, and any that are no longer needed
 *     are removed rather than marked paid (marking them paid overstated what came in)
 * An upfront enrollment with no rows gets them: the payment as row 1 and the balance, if any,
 * as row 2.
 */

import { addDays } from 'date-fns';
import { prisma } from '@/lib/db';
import { splitEvenly } from '@/lib/installments';
import { summarizeEnrollmentPayments } from '@/lib/enrollment-helpers';
import { buildPortalLink, publishInstallmentPaid } from '@/lib/events';
import { noticePeople } from '@/lib/notice-contacts';
import { TREASURY } from '@/lib/constants';

/** Days until the balance is due when an upfront enrollment is only partly paid. */
const BALANCE_DUE_DAYS = 28;

export interface AppliedPayment {
  enrollmentId: bigint;
  installmentNo: number;
  amount: number;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
}

export class PaymentRejected extends Error {}

/**
 * Records `amount` against the enrollment and re-spreads the balance. Runs in one transaction
 * so a concurrent payment can never see half an update. `maxAmount` lets a caller refuse more
 * than is owed (admin entry); treasury events are applied as received.
 */
export async function applyEnrollmentPayment(
  enrollmentId: bigint,
  amount: number,
  opts: { paymentRef?: string | null; paidAt?: Date; rejectOverpayment?: boolean } = {},
): Promise<AppliedPayment> {
  if (!Number.isInteger(amount) || amount <= 0) throw new PaymentRejected('Enter a whole amount above zero.');
  const paidAt = opts.paidAt ?? new Date();

  return prisma.$transaction(async (tx) => {
    // Row lock: two payments for one enrollment are applied one after the other.
    await tx.$executeRaw`SELECT id FROM enrollments WHERE id = ${enrollmentId} FOR UPDATE`;
    const enrollment = await tx.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { installments: { orderBy: { installmentNo: 'asc' } } },
    });
    if (!enrollment) throw new PaymentRejected('Enrollment not found.');

    const before = summarizeEnrollmentPayments(enrollment, enrollment.installments);
    if (before.remainingBalance <= 0) throw new PaymentRejected('This enrollment is already paid in full.');
    if (opts.rejectOverpayment && amount > before.remainingBalance) {
      throw new PaymentRejected(`That is more than the balance of ${enrollment.currency} ${before.remainingBalance.toLocaleString()}.`);
    }

    const rows = enrollment.installments;
    const unpaid = rows.filter((i) => i.status !== 'paid');
    let installmentNo: number;

    if (rows.length === 0) {
      // Upfront enrollment: give it a schedule so the balance has somewhere to live.
      installmentNo = 1;
      await tx.installmentSchedule.create({
        data: { enrollmentId, installmentNo: 1, amount, currency: enrollment.currency, dueDate: paidAt, status: 'paid', paidAt, paymentRef: opts.paymentRef ?? null },
      });
      const balance = before.totalAmount - amount;
      if (balance > 0) {
        await tx.installmentSchedule.create({
          data: { enrollmentId, installmentNo: 2, amount: balance, currency: enrollment.currency, dueDate: addDays(paidAt, BALANCE_DUE_DAYS), status: 'pending' },
        });
      }
    } else if (unpaid.length === 0) {
      // Every row is paid yet a balance remains (rows edited by hand): record it as a new row.
      installmentNo = rows[rows.length - 1].installmentNo + 1;
      await tx.installmentSchedule.create({
        data: { enrollmentId, installmentNo, amount, currency: enrollment.currency, dueDate: paidAt, status: 'paid', paidAt, paymentRef: opts.paymentRef ?? null },
      });
    } else {
      const [next, ...later] = unpaid;
      installmentNo = next.installmentNo;
      await tx.installmentSchedule.update({
        where: { id: next.id },
        data: { status: 'paid', paidAt, paymentRef: opts.paymentRef ?? null, amount },
      });
      const owed = before.remainingBalance - amount;
      if (owed <= 0) {
        if (later.length > 0) {
          await tx.installmentSchedule.deleteMany({ where: { id: { in: later.map((i) => i.id) } } });
        }
      } else if (later.length > 0) {
        const amounts = splitEvenly(owed, later.length);
        for (let i = 0; i < later.length; i++) {
          await tx.installmentSchedule.update({ where: { id: later[i].id }, data: { amount: amounts[i], status: 'pending' } });
        }
      } else {
        // Short on the last installment: the rest is still due when that one was.
        await tx.installmentSchedule.create({
          data: {
            enrollmentId,
            installmentNo: rows[rows.length - 1].installmentNo + 1,
            amount: owed,
            currency: enrollment.currency,
            dueDate: next.dueDate > paidAt ? next.dueDate : paidAt,
            status: 'pending',
          },
        });
      }
    }

    await tx.enrollment.update({
      where: { id: enrollmentId },
      data: { paymentStatus: 'succeeded', paymentRef: opts.paymentRef ?? enrollment.paymentRef, notifiedAt: new Date() },
    });

    const after = await tx.installmentSchedule.findMany({ where: { enrollmentId }, orderBy: { installmentNo: 'asc' } });
    const summary = summarizeEnrollmentPayments({ ...enrollment, paymentStatus: 'succeeded' }, after);
    return {
      enrollmentId,
      installmentNo,
      amount,
      totalAmount: summary.totalAmount,
      amountPaid: summary.amountPaid,
      remainingBalance: summary.remainingBalance,
    };
  });
}

/** The receipt email (notifications-api digitika_consumer) for a payment just applied. */
export async function publishPaymentReceipt(applied: AppliedPayment, paymentRef?: string | null): Promise<void> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: applied.enrollmentId },
    include: { installments: { orderBy: { installmentNo: 'asc' } }, studentUser: true },
  });
  if (!enrollment?.studentUser) return;
  const nextUnpaid = enrollment.installments.find((i) => i.status !== 'paid');
  await publishInstallmentPaid({
    ...noticePeople(enrollment.studentUser),
    courseName: enrollment.courseName,
    installmentNo: applied.installmentNo,
    totalInstallments: enrollment.installments.length,
    amountPaid: applied.amount,
    currency: enrollment.currency,
    paymentRef: paymentRef ?? undefined,
    enrollmentId: enrollment.id.toString(),
    remainingBalance: applied.remainingBalance,
    nextInstallmentDate: nextUnpaid ? nextUnpaid.dueDate.toISOString().split('T')[0] : undefined,
    nextInstallmentAmount: nextUnpaid ? nextUnpaid.amount : undefined,
    portalLink: buildPortalLink(enrollment.id, enrollment.studentUser.id),
  });
}

export const MANUAL_PAYMENT_METHODS = ['bank_transfer', 'cash', 'cheque', 'mpesa'] as const;
export type ManualPaymentMethod = (typeof MANUAL_PAYMENT_METHODS)[number];

const TREASURY_API_URL = process.env.TREASURY_API_URL ?? 'https://booksapi.codevertexafrica.com';
const SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY ?? '';

/**
 * Books a payment received outside the website (bank deposit, cash, cheque, M-Pesa to the
 * till) in treasury, so the books and the enrollment agree. Uses treasury's S2S manual account
 * payment route: a succeeded account_payment intent through treasury's one settle path, on the
 * enrollment's receipt reference. Treasury refuses to book the same method and reference twice
 * (booked: false), which is how a slip entered twice is caught.
 */
export async function bookManualPaymentInTreasury(p: {
  accountRef: string;
  enrollmentId: string;
  amount: number;
  currency: string;
  method: ManualPaymentMethod;
  reference: string;
  payerName: string;
  requestId: string;
}): Promise<{ intentId: string; booked: boolean }> {
  if (!SERVICE_KEY) throw new Error('INTERNAL_SERVICE_KEY is not set, so treasury cannot be updated');
  const res = await fetch(
    `${TREASURY_API_URL}/api/v1/s2s/${encodeURIComponent(TREASURY.tenant)}/accounts/${encodeURIComponent(p.accountRef)}/manual-payments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': SERVICE_KEY, 'X-Request-ID': p.requestId },
      body: JSON.stringify({
        account_id: p.enrollmentId,
        amount: p.amount,
        currency: p.currency,
        method: p.method,
        reference: p.reference,
        payer_name: p.payerName,
        source_service: 'codevertex-website',
        // An enrollment has no invoices for treasury to allocate to, so book it as a direct
        // receipt (same type as the online payments): the ledger posts it Dr bank / Cr revenue.
        // As account_payment it was held as account credit and never reached the ledger.
        reference_type: 'digitika_enrollment',
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`treasury refused the payment (${res.status}): ${await res.text().catch(() => '')}`);
  }
  const body = (await res.json()) as { intent_id?: string; booked?: boolean };
  return { intentId: body.intent_id ?? '', booked: body.booked !== false };
}

export class ManualPaymentError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409 | 502) {
    super(message);
  }
}

/**
 * The one way an admin puts money on an enrollment: treasury books it first, then the
 * allocator applies it. Used by "Record payment" and by "Mark as paid" when enrolling a
 * student, so no enrollment is ever marked paid without a treasury record behind it.
 * Throws ManualPaymentError with the status and a message fit to show the admin.
 */
export async function recordManualPayment(p: {
  enrollmentId: bigint;
  amount: number;
  method: ManualPaymentMethod;
  reference: string;
  paidAt?: Date;
  requestId: string;
  /** Skip the receipt email, e.g. when the enrollment confirmation was just sent. */
  skipReceipt?: boolean;
}): Promise<AppliedPayment & { treasuryIntentId: string }> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: p.enrollmentId },
    include: { installments: { orderBy: { installmentNo: 'asc' } } },
  });
  if (!enrollment) throw new ManualPaymentError('Not found', 404);
  if (!enrollment.studentUserId) throw new ManualPaymentError('This enrollment has no student record.', 400);
  const { remainingBalance } = summarizeEnrollmentPayments(enrollment, enrollment.installments);
  if (remainingBalance <= 0) throw new ManualPaymentError('This enrollment is already paid in full.', 409);
  if (p.amount > remainingBalance) {
    throw new ManualPaymentError(`That is more than the balance of ${enrollment.currency} ${remainingBalance.toLocaleString()}.`, 400);
  }

  const paymentRef = `${p.method}:${p.reference}`;
  let booking;
  try {
    booking = await bookManualPaymentInTreasury({
      // The same receipt reference online payments carry, so treasury files it with them.
      accountRef: `DGT-${enrollment.id}-DGT-${enrollment.studentUserId}`,
      enrollmentId: enrollment.id.toString(),
      amount: p.amount,
      currency: enrollment.currency,
      method: p.method,
      reference: p.reference,
      payerName: enrollment.fullName,
      requestId: p.requestId,
    });
  } catch (err) {
    console.error('[manual-payment] treasury booking failed:', err);
    throw new ManualPaymentError('Treasury did not accept the payment, so nothing was recorded. Try again.', 502);
  }
  if (!booking.booked) {
    throw new ManualPaymentError(`A ${p.method.replace('_', ' ')} payment with reference ${p.reference} is already recorded.`, 409);
  }

  try {
    const applied = await applyEnrollmentPayment(p.enrollmentId, p.amount, { paymentRef, paidAt: p.paidAt, rejectOverpayment: true });
    if (!p.skipReceipt) {
      publishPaymentReceipt(applied, paymentRef).catch((err) => console.error('[manual-payment] receipt event failed:', err));
    }
    // Lazy import: portal-accounts imports notifications, which this module's callers already load.
    const { provisionEnrollmentAccounts } = await import('@/lib/portal-accounts');
    provisionEnrollmentAccounts(p.enrollmentId, p.requestId).catch((err) =>
      console.error('[manual-payment] portal account provisioning failed:', err)
    );
    return { ...applied, treasuryIntentId: booking.intentId };
  } catch (err) {
    // Booked in treasury but not applied here (a concurrent payment cleared the balance first).
    const reason = err instanceof PaymentRejected ? err.message : 'an internal error';
    console.error(`[manual-payment] enrollment ${p.enrollmentId}: booked in treasury (${booking.intentId}) but not applied:`, err);
    throw new ManualPaymentError(
      `Treasury recorded the payment, but the schedule was not updated (${reason}). Ask finance to refund or move intent ${booking.intentId}.`,
      409,
    );
  }
}
