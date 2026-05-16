'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, BookOpen, Calendar, CreditCard, ChevronRight, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { SITE } from '@/lib/constants';

interface InstallmentRow {
  installmentNo: number;
  amount: number;
  dueDate: string;
  status: string;
  label: string;
}

interface EnrollmentSummary {
  enrollmentId: string;
  studentId: string;
  courseName: string;
  category: string;
  fullName: string;
  paymentPlan: string;
  firstPaymentAmount: number;
  totalAmount: number;
  remainingBalance: number;
  currency: string;
  paymentStatus: string;
  installments: InstallmentRow[];
  createdAt: string;
}

export function PaymentSuccessClient() {
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState<EnrollmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Treasury redirects back with ?reference_id=DGT-{id}-DGT-{studentSuffix}&status=succeeded
  const referenceId = searchParams.get('reference_id');
  const status = searchParams.get('status');

  useEffect(() => {
    if (!referenceId) {
      setError('No payment reference found. If you completed payment, check your email for confirmation.');
      setLoading(false);
      return;
    }

    const match = referenceId.match(/^DGT-(\d+)-/);
    if (!match) {
      setError('Invalid payment reference.');
      setLoading(false);
      return;
    }

    const enrollmentId = match[1];
    fetch(`/api/enrollments/${enrollmentId}/summary`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSummary(data);
      })
      .catch((err) => setError(err.message ?? 'Could not load enrollment details'))
      .finally(() => setLoading(false));
  }, [referenceId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading your enrollment details…</p>
        </div>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
          <h1 className="text-2xl font-bold">Payment Received</h1>
          <p className="text-muted-foreground">
            {error ?? 'We could not load your enrollment summary.'} Please check your email for confirmation or contact us at{' '}
            <a href={`mailto:${SITE.email}`} className="text-primary underline">{SITE.email}</a>.
          </p>
          <Link href="/digitika" className="inline-block mt-4 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
            Browse Courses
          </Link>
        </div>
      </main>
    );
  }

  const isUpfront = summary.paymentPlan === 'upfront';
  const planLabel = summary.paymentPlan === '2-installments'
    ? '2 Installments'
    : summary.paymentPlan === '3-installments'
    ? '3 Installments'
    : 'Upfront (Full)';

  const paidInstallments = summary.installments.filter((i) => i.status === 'paid');
  const pendingInstallments = summary.installments.filter((i) => i.status === 'pending');

  return (
    <main className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Hero confirmation */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">You're enrolled!</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Welcome to <strong>{summary.courseName}</strong>, {summary.fullName.split(' ')[0]}.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Student ID: <span className="font-mono font-semibold text-foreground">{summary.studentId}</span>
          </p>
        </div>

        {/* Payment summary card */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Payment Summary</h2>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <Row label="Course" value={summary.courseName} />
            <Row label="Category" value={summary.category} />
            <Row label="Payment Plan" value={planLabel} highlight />
            <Row
              label="Amount Paid Now"
              value={`${formatCurrency(summary.firstPaymentAmount, summary.currency)}`}
              highlight
              valueClass="text-emerald-600 dark:text-emerald-400 font-bold text-lg"
            />
            {!isUpfront && (
              <>
                <Row
                  label="Total Course Fee"
                  value={formatCurrency(summary.totalAmount, summary.currency)}
                />
                <Row
                  label="Remaining Balance"
                  value={formatCurrency(summary.remainingBalance, summary.currency)}
                  valueClass={summary.remainingBalance > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}
                />
              </>
            )}
          </div>
        </div>

        {/* Installment schedule */}
        {!isUpfront && summary.installments.length > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm">Installment Schedule</h2>
              </div>
            </div>
            <div className="divide-y divide-border">
              {summary.installments.map((inst) => (
                <div key={inst.installmentNo} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Installment {inst.installmentNo} — {inst.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due: {new Date(inst.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(inst.amount, summary.currency)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      inst.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {inst.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {pendingInstallments.length > 0 && (
              <div className="px-6 py-4 bg-amber-500/5 border-t border-amber-500/20">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  You will receive a reminder email before each upcoming payment is due. Pay on time to keep your enrollment active.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Next steps */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">What Happens Next</h2>
            </div>
          </div>
          <ol className="divide-y divide-border">
            {[
              'Check your inbox — a confirmation email has been sent to you.',
              'Our team will contact you within 24 hours with orientation details.',
              'You\'ll receive class schedule and joining instructions before your start date.',
              !isUpfront ? 'We\'ll remind you before each upcoming installment is due.' : null,
            ].filter(Boolean).map((step, i) => (
              <li key={i} className="px-6 py-4 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/digitika"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Explore More Courses <ChevronRight className="h-4 w-4" />
          </Link>
          <a
            href={SITE.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border bg-secondary text-foreground font-semibold text-sm hover:bg-muted transition-colors"
          >
            Chat with Us on WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  highlight = false,
  valueClass,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  valueClass?: string;
}) {
  return (
    <div className={`flex items-center justify-between py-1 ${highlight ? 'border-b border-border pb-3' : ''}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={valueClass ?? 'text-sm font-medium text-foreground'}>{value}</span>
    </div>
  );
}
