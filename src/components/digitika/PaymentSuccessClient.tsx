'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle2, AlertCircle, CreditCard, Calendar, BookOpen,
  ArrowRight, MessageCircle, GraduationCap, Clock, ChevronRight,
  Sparkles, Wallet, BadgeCheck, Bookmark, Share2, Copy, Check,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { SITE, TREASURY } from '@/lib/constants';

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
  amountPaid: number;
  remainingBalance: number;
  currency: string;
  paymentStatus: string;
  installments: InstallmentRow[];
  createdAt: string;
}

const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th'];

function ordinal(n: number) {
  return ORDINALS[n] ?? `${n}th`;
}

export function PaymentSuccessClient() {
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState<EnrollmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingInst, setPayingInst] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Treasury-ui redirects with ?reference=DGT-{id}-DGT-{suffix}&payment=succeeded
  // Fallback to ?reference_id= and ?status= for direct treasury intent return URLs
  const referenceId = searchParams.get('reference') ?? searchParams.get('reference_id');

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

  function copyPageLink() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  async function handlePayInstallment(inst: InstallmentRow) {
    if (!summary) return;
    setPayingInst(inst.installmentNo);
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: summary.enrollmentId,
          installmentNo: inst.installmentNo,
        }),
      });
      // Best-effort: just open treasury pay URL directly
    } catch { /* ignore */ } finally {
      const params = new URLSearchParams({
        amount: String(inst.amount),
        tenant: TREASURY.tenant,
        reference_id: referenceId ?? summary.enrollmentId,
        reference_type: 'digitika_enrollment',
        currency: summary.currency,
        description: `${summary.courseName} — ${ordinal(inst.installmentNo)} Installment`,
        redirect_url: `${typeof window !== 'undefined' ? window.location.origin : ''}/digitika/success`,
        button_text: 'View My Enrollment',
        gateways: 'paystack,mpesa',
        email: '',
      });
      window.open(`${TREASURY.payUrl}?${params}`, '_blank');
      setPayingInst(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">Fetching your enrollment…</p>
            <p className="text-sm text-muted-foreground mt-1">This will only take a moment</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Payment Received</h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {error ?? 'We could not load your enrollment summary.'} Check your email for confirmation or contact us.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <a
                href={`mailto:${SITE.email}`}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Email Us
              </a>
              <Link
                href="/digitika"
                className="px-5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold hover:bg-muted transition-colors"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const isUpfront = summary.paymentPlan === 'upfront';
  const paidCount = summary.installments.filter((i) => i.status === 'paid').length;
  const totalInstallments = summary.installments.length;
  const progressPct = isUpfront ? 100 : totalInstallments > 0 ? Math.round((paidCount / totalInstallments) * 100) : 100;
  const amountPaid = summary.amountPaid ?? (isUpfront ? summary.totalAmount : summary.firstPaymentAmount);
  const firstName = summary.fullName.split(' ')[0];
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  const planLabel =
    summary.paymentPlan === '2-installments' ? '2 Installments' :
    summary.paymentPlan === '3-installments' ? '3 Installments' :
    'Upfront';

  return (
    <main className="min-h-screen bg-background">

      {/* ── Hero band ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 py-14 px-4 text-white">
        {/* Decorative rings */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5 blur-2xl" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-black/20"
          >
            <CheckCircle2 className="h-10 w-10 text-white" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-bold uppercase tracking-widest mb-4">
              <Sparkles className="h-3 w-3" /> Enrollment Confirmed
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              You&rsquo;re enrolled, {firstName}!
            </h1>
            <p className="mt-3 text-emerald-100 text-base leading-relaxed max-w-lg mx-auto">
              Welcome to <span className="font-bold text-white">{summary.courseName}</span>.
              Your learning journey starts here.
            </p>
          </motion.div>

          {/* Student ID pill */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm text-sm"
          >
            <BadgeCheck className="h-4 w-4 text-emerald-300" />
            <span className="text-emerald-200 text-xs">Student ID:</span>
            <span className="font-mono font-bold tracking-wider text-white text-sm">{summary.studentId}</span>
          </motion.div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">

        {/* ── Save this page banner ─── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-2xl bg-amber-500/8 border border-amber-500/25"
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Bookmark className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">Save this page</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                Use this link to view your enrollment and pay upcoming installments. It was also sent to your email.
              </p>
            </div>
          </div>
          <button
            onClick={copyPageLink}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors shrink-0"
          >
            {copied ? <><Check className="h-3.5 w-3.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy Link</>}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`My Digitika enrollment: ${pageUrl}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-foreground text-xs font-bold hover:bg-muted transition-colors shrink-0"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </a>
        </motion.div>

        {/* ── Payment overview ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
        >
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-bold text-foreground">Payment Overview</h2>
          </div>

          <div className="p-6">
            {/* Main amount row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                  Amount Paid
                </p>
                <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {formatCurrency(amountPaid, summary.currency)}
                </p>
                {!isUpfront && summary.remainingBalance > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatCurrency(summary.remainingBalance, summary.currency)} remaining of {formatCurrency(summary.totalAmount, summary.currency)}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <InfoPill label="Plan" value={planLabel} />
                <InfoPill label="Category" value={summary.category} />
              </div>
            </div>

            {/* Progress bar (installment plan only) */}
            {!isUpfront && (
              <div>
                <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
                  <span>{paidCount} of {totalInstallments} payment{totalInstallments !== 1 ? 's' : ''} made</span>
                  <span>{progressPct}% complete</span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                    className="h-full rounded-full bg-emerald-500"
                  />
                </div>
              </div>
            )}

            {isUpfront && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 mt-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                  Full course fee paid — you&rsquo;re all set!
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Installment schedule ─── */}
        {!isUpfront && summary.installments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
          >
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Installment Schedule</h2>
                <p className="text-xs text-muted-foreground">{planLabel} plan</p>
              </div>
            </div>

            <div className="divide-y divide-border">
              {summary.installments.map((inst, idx) => {
                const isPaid = inst.status === 'paid';
                const isNext = !isPaid && idx === summary.installments.findIndex((i) => i.status !== 'paid');
                return (
                  <div
                    key={inst.installmentNo}
                    className={`px-6 py-4 flex items-center gap-4 ${isNext ? 'bg-amber-500/3' : ''}`}
                  >
                    {/* Step circle */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-black text-sm ${
                      isPaid
                        ? 'bg-emerald-500 text-white'
                        : isNext
                        ? 'bg-amber-500/15 border-2 border-amber-500/50 text-amber-600 dark:text-amber-400'
                        : 'bg-secondary border border-border text-muted-foreground'
                    }`}>
                      {isPaid ? <CheckCircle2 className="h-4 w-4" /> : inst.installmentNo}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {ordinal(inst.installmentNo)} Payment
                        {isNext && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase tracking-wide">Next due</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        {isPaid
                          ? 'Paid'
                          : `Due ${new Date(inst.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                        }
                      </p>
                    </div>

                    {/* Amount + status / pay button */}
                    <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                      <p className="text-sm font-bold text-foreground">{formatCurrency(inst.amount, summary.currency)}</p>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Paid
                        </span>
                      ) : isNext ? (
                        <button
                          onClick={() => handlePayInstallment(inst)}
                          disabled={payingInst === inst.installmentNo}
                          className="text-[11px] font-bold px-3 py-1 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
                        >
                          {payingInst === inst.installmentNo ? 'Opening…' : 'Pay Now'}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                          <Wallet className="h-3 w-3" /> Upcoming
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-3 bg-muted/30 border-t border-border">
              <p className="text-xs text-muted-foreground">
                You&rsquo;ll receive a reminder email before each upcoming payment is due. Pay on time to keep your enrollment active.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── What happens next + Course info (2 col on md+) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Course card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-bold text-foreground text-sm">Your Enrolment</h2>
            </div>
            <div className="p-5 space-y-3">
              <DetailRow label="Course" value={summary.courseName} />
              <DetailRow label="Category" value={summary.category} />
              <DetailRow label="Payment Plan" value={planLabel} />
              <DetailRow label="Total Fee" value={formatCurrency(summary.totalAmount, summary.currency)} />
              <DetailRow
                label="Status"
                value={
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                    summary.paymentStatus === 'succeeded'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {summary.paymentStatus === 'succeeded' ? (
                      <><CheckCircle2 className="h-3 w-3" /> Confirmed</>
                    ) : (
                      <><Clock className="h-3 w-3" /> Processing</>
                    )}
                  </span>
                }
              />
            </div>
          </motion.div>

          {/* Next steps */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-bold text-foreground text-sm">What Happens Next</h2>
            </div>
            <ol className="divide-y divide-border">
              {([
                { icon: '📧', text: 'A confirmation email is on its way to your inbox.' },
                { icon: '📞', text: 'Our team will reach out within 24 hours with orientation details.' },
                { icon: '📅', text: "You'll receive your class schedule before the start date." },
                ...(!isUpfront ? [{ icon: '🔔', text: "We'll remind you before each upcoming installment." }] : []),
              ]).map(({ icon, text }, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="text-base shrink-0 mt-0.5">{icon}</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                </li>
              ))}
            </ol>
          </motion.div>
        </div>

        {/* ── CTAs ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link
            href="/digitika"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
          >
            Explore More Courses <ChevronRight className="h-4 w-4" />
          </Link>
          <a
            href={SITE.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-border bg-card text-foreground font-bold text-sm hover:bg-muted transition-colors"
          >
            <MessageCircle className="h-4 w-4 text-[#25D366]" />
            Chat on WhatsApp
          </a>
          <a
            href={`mailto:${SITE.email}`}
            className="hidden sm:flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-border bg-card text-muted-foreground font-semibold text-sm hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            Email Us
          </a>
        </motion.div>
      </div>
    </main>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-semibold text-foreground text-right">{value}</span>
    </div>
  );
}
