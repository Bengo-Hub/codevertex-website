import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';
import { MANUAL_PAYMENT_METHODS, ManualPaymentError, recordManualPayment } from '@/lib/enrollment-payments';

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
 * recordManualPayment books it in treasury first, so a deposit is never on the enrollment
 * without being in the books, then applies it as the next installment and spreads what is still
 * owed over the remaining ones. The student gets the usual receipt, and portal accounts if this
 * was the first payment.
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

  try {
    const applied = await recordManualPayment({
      enrollmentId: BigInt(id),
      amount,
      method,
      reference,
      paidAt,
      requestId: req.headers.get('x-request-id') ?? crypto.randomUUID(),
    });
    return NextResponse.json({
      ok: true,
      treasuryIntentId: applied.treasuryIntentId,
      installmentNo: applied.installmentNo,
      amountPaid: applied.amountPaid,
      remainingBalance: applied.remainingBalance,
    });
  } catch (err) {
    if (err instanceof ManualPaymentError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
