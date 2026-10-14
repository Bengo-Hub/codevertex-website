'use client';

import { useState } from 'react';
import { X, Landmark, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authedFetch } from '@/lib/auth/authed-fetch';
import { formatCurrency } from '@/lib/utils';

const METHODS = [
  { value: 'bank_transfer', label: 'Bank deposit or transfer' },
  { value: 'mpesa', label: 'M-Pesa (paid to the till directly)' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
] as const;

export interface RecordPaymentTarget {
  enrollmentId: string;
  studentName: string;
  courseName: string;
  currency: string;
  /** Prefill: the installment being settled. */
  suggestedAmount: number;
}

/**
 * Records a payment received outside the website. The server books it in treasury, applies it
 * as the next installment and spreads the rest of the balance over the remaining installments.
 */
export function RecordPaymentDialog({ target, onClose, onRecorded }: { target: RecordPaymentTarget; onClose: () => void; onRecorded: () => void }) {
  const [amount, setAmount] = useState(String(target.suggestedAmount));
  const [method, setMethod] = useState<(typeof METHODS)[number]['value']>('bank_transfer');
  const [reference, setReference] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const inputCls = 'w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Math.round(Number(amount));
    if (!value || value <= 0) return setError('Enter the amount received.');
    if (reference.trim().length < 3) return setError('Enter the bank slip or transaction reference.');
    setSaving(true);
    setError('');
    try {
      const res = await authedFetch(`/api/admin/enrollments/${target.enrollmentId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: value, method, reference: reference.trim(), paidAt }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof body?.error === 'string' ? body.error : 'Could not record the payment.');
        return;
      }
      toast.success(
        body.remainingBalance > 0
          ? `Payment recorded. Balance ${formatCurrency(body.remainingBalance, target.currency)} spread over the remaining installments.`
          : 'Payment recorded. The enrollment is paid in full.',
      );
      onRecorded();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl" role="dialog" aria-labelledby="record-payment-title">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <Landmark className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <h2 id="record-payment-title" className="text-base font-semibold text-foreground">Record a payment</h2>
              <p className="text-xs text-muted-foreground">{target.studentName}, {target.courseName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Amount received ({target.currency})</span>
              <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} required />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Date received</span>
              <input type="date" value={paidAt} max={new Date().toISOString().split('T')[0]} onChange={(e) => setPaidAt(e.target.value)} className={inputCls} required />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Paid by</span>
            <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className={inputCls}>
              {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Bank slip or transaction reference</span>
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. FT26287XK9" className={inputCls} required />
          </label>
          <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            This is booked in treasury and counted as the next installment. Paid more or less than it? The rest of the balance is spread over the remaining installments.
          </p>
          {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
        </div>

        <div className="flex gap-2 border-t border-border px-5 py-4">
          <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Record payment
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
        </div>
      </form>
    </div>
  );
}
