'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, KeyRound, LogOut, BookOpen, Award, CreditCard, Megaphone, AlertCircle,
  CheckCircle2, Clock, Loader2, ArrowLeft, Lock,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Installment {
  installmentNo: number;
  amount: number;
  dueDate: string;
  status: string;
  paidAt: string | null;
  overdue: boolean;
}

interface Enrollment {
  id: string;
  courseId: string;
  courseName: string;
  cohort: { name: string; startDate: string; endDate: string | null } | null;
  paymentStatus: string;
  paymentPlan: string;
  currency: string;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  overdueAmount: number;
  nextDue: { installmentNo: number; amount: number; dueDate: string } | null;
  installments: Installment[];
  progress: { totalLessons: number; completedLessons: number; percent: number; lastActivityAt: string | null } | null;
}

interface Overview {
  student: { id: string; firstName: string };
  totals: { balance: number; overdue: number; currency: string };
  enrollments: Enrollment[];
  recentQuizzes: { title: string; scorePct: number; passed: boolean; takenAt: string }[];
  certificates: { certificateNumber: string; courseName: string; issuedAt: string; verifyToken: string }[];
  announcements: { title: string; body: string; courseName: string; postedAt: string }[];
}

type Step = 'loading' | 'id' | 'code' | 'dashboard';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

export function ParentPortalClient() {
  const [step, setStep] = useState<Step>('loading');
  const [studentId, setStudentId] = useState('');
  const [code, setCode] = useState('');
  const [channels, setChannels] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Overview | null>(null);
  const [paying, setPaying] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    const res = await fetch('/api/parent/overview', { cache: 'no-store' });
    if (res.ok) {
      setData(await res.json());
      setStep('dashboard');
      return true;
    }
    return false;
  }, []);

  // Resume an existing (still valid) parent session.
  useEffect(() => {
    loadOverview().then((ok) => { if (!ok) setStep('id'); }).catch(() => setStep('id'));
  }, [loadOverview]);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/parent/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: studentId.trim().toUpperCase() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body.error ?? 'Could not send a code.'); return; }
      setChannels(body.channels ?? []);
      setCode('');
      setStep('code');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/parent/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: studentId.trim().toUpperCase(), code: code.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body.error ?? 'Could not verify the code.'); return; }
      if (!(await loadOverview())) setError('Could not load the portal. Please try again.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch('/api/parent/logout', { method: 'POST' }).catch(() => {});
    setData(null);
    setCode('');
    setStep('id');
  }

  async function pay(enrollmentId: string, installmentNo?: number) {
    setPaying(`${enrollmentId}:${installmentNo ?? 'all'}`);
    try {
      const res = await fetch('/api/parent/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, installmentNo }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) { setStep('id'); setError('Your session expired. Please verify again.'); return; }
      if (!res.ok || !body.url) { setError(body.error ?? 'Could not start the payment.'); return; }
      window.location.href = body.url;
    } finally {
      setPaying(null);
    }
  }

  const inputCls = 'w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-mono tracking-wider text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50';

  return (
    <main className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 pt-28 pb-12 px-4 text-primary-foreground">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-widest mb-3">
              <ShieldCheck className="h-3 w-3" /> Parent Portal
            </p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {step === 'dashboard' && data ? `${data.student.firstName}'s learning` : 'Track your child\'s learning'}
            </h1>
            <p className="mt-2 text-primary-foreground/80 max-w-xl">
              Progress, results and fees in one place. No account needed: just the Student ID and a one-time code.
            </p>
          </div>
          {step === 'dashboard' && (
            <button onClick={signOut} className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-full bg-white/15 border border-white/25 text-sm font-semibold hover:bg-white/25">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {step === 'loading' && (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        )}

        {step === 'id' && (
          <form onSubmit={requestCode} className="max-w-md mx-auto rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
            <div>
              <label htmlFor="sid" className="block text-sm font-semibold text-foreground mb-2">Student ID</label>
              <input id="sid" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="DGT-XXXXXXXX" autoComplete="off" className={inputCls} required />
              <p className="mt-2 text-xs text-muted-foreground">Find it on the enrollment confirmation email or payment receipt.</p>
            </div>
            <button disabled={busy || !studentId.trim()} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Send me a code
            </button>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              For your child&apos;s privacy, the code goes only to the email and phone number used at enrollment.
            </p>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={verify} className="max-w-md mx-auto rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
            <button type="button" onClick={() => { setStep('id'); setError(null); }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Change Student ID
            </button>
            <div>
              <label htmlFor="otp" className="block text-sm font-semibold text-foreground mb-2">Enter the 6-digit code</label>
              <input id="otp" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" className={inputCls} required />
              <p className="mt-2 text-xs text-muted-foreground">
                Sent to {channels.join(' and ') || 'the contacts on file'}. It expires in 5 minutes.
              </p>
            </div>
            <button disabled={busy || code.length !== 6} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Open parent portal
            </button>
            <button type="button" onClick={() => requestCode()} disabled={busy} className="w-full text-xs font-semibold text-primary hover:underline disabled:opacity-50">
              Didn&apos;t get it? Send a new code
            </button>
          </form>
        )}

        {step === 'dashboard' && data && (
          <div className="space-y-8">
            {/* Fees summary */}
            <section className="grid sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Courses</p>
                <p className="mt-1 text-2xl font-black text-foreground">{data.enrollments.length}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fee balance</p>
                <p className="mt-1 text-2xl font-black text-foreground">{formatCurrency(data.totals.balance, data.totals.currency)}</p>
              </div>
              <div className={`rounded-2xl border p-5 ${data.totals.overdue > 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-border bg-card'}`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overdue (arrears)</p>
                <p className={`mt-1 text-2xl font-black ${data.totals.overdue > 0 ? 'text-amber-600' : 'text-foreground'}`}>{formatCurrency(data.totals.overdue, data.totals.currency)}</p>
              </div>
            </section>

            {data.enrollments.length === 0 && (
              <p className="text-sm text-muted-foreground">No enrollments yet.</p>
            )}

            {data.enrollments.map((e) => (
              <section key={e.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <Link href={`/digitika/${e.courseId}`} className="font-bold text-foreground hover:text-primary">{e.courseName}</Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {e.cohort ? `${e.cohort.name} · starts ${fmtDate(e.cohort.startDate)}` : 'Cohort to be confirmed'}
                    </p>
                  </div>
                  <span className={`self-start text-xs font-bold px-2.5 py-1 rounded-full ${e.remainingBalance === 0 ? 'bg-emerald-500/10 text-emerald-600' : e.overdueAmount > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                    {e.remainingBalance === 0 ? 'Fully paid' : e.overdueAmount > 0 ? 'Payment overdue' : 'Balance due'}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-0 md:divide-x divide-border">
                  {/* Progress */}
                  <div className="p-5 space-y-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><BookOpen className="h-4 w-4 text-primary" /> Progress</p>
                    {e.progress && e.progress.totalLessons > 0 ? (
                      <>
                        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${e.progress.percent}%` }} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {e.progress.completedLessons} of {e.progress.totalLessons} lessons completed ({e.progress.percent}%)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last activity: {e.progress.lastActivityAt ? fmtDate(e.progress.lastActivityAt) : 'not started yet'}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Online lessons for this course will appear here once classes start.</p>
                    )}
                  </div>

                  {/* Fees */}
                  <div className="p-5 space-y-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><CreditCard className="h-4 w-4 text-primary" /> Fees</p>
                    <p className="text-sm text-muted-foreground">
                      Paid {formatCurrency(e.amountPaid, e.currency)} of {formatCurrency(e.totalAmount, e.currency)}
                    </p>
                    {e.installments.length > 0 ? (
                      <ul className="space-y-1.5">
                        {e.installments.map((i) => (
                          <li key={i.installmentNo} className="flex items-center justify-between gap-2 text-sm">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              {i.status === 'paid' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Clock className={`h-3.5 w-3.5 ${i.overdue ? 'text-amber-500' : ''}`} />}
                              #{i.installmentNo} · due {fmtDate(i.dueDate)}
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{formatCurrency(i.amount, e.currency)}</span>
                              {i.status !== 'paid' && (
                                <button
                                  onClick={() => pay(e.id, i.installmentNo)}
                                  disabled={paying !== null}
                                  className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                                >
                                  {paying === `${e.id}:${i.installmentNo}` ? '…' : 'Pay'}
                                </button>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : e.remainingBalance > 0 ? (
                      <button onClick={() => pay(e.id)} disabled={paying !== null} className="text-sm font-bold px-4 py-2 rounded-full bg-primary text-primary-foreground disabled:opacity-50">
                        Pay {formatCurrency(e.remainingBalance, e.currency)}
                      </button>
                    ) : null}
                    <p className="text-[11px] text-muted-foreground">Payments by M-Pesa or card. Receipts are sent to the email on file.</p>
                  </div>
                </div>
              </section>
            ))}

            <div className="grid md:grid-cols-2 gap-6">
              <section className="rounded-2xl border border-border bg-card p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3"><Award className="h-4 w-4 text-primary" /> Quiz results & certificates</p>
                {data.recentQuizzes.length === 0 && data.certificates.length === 0 && (
                  <p className="text-sm text-muted-foreground">No quizzes or certificates yet.</p>
                )}
                <ul className="space-y-2">
                  {data.certificates.map((c) => (
                    <li key={c.certificateNumber} className="text-sm">
                      <Link href={`/certificates/${c.verifyToken}`} className="font-semibold text-primary hover:underline">{c.courseName}</Link>
                      <span className="text-muted-foreground"> · certificate issued {fmtDate(c.issuedAt)}</span>
                    </li>
                  ))}
                  {data.recentQuizzes.map((q, idx) => (
                    <li key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate">{q.title}</span>
                      <span className={`font-semibold ${q.passed ? 'text-emerald-600' : 'text-amber-600'}`}>{q.scorePct}%</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl border border-border bg-card p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3"><Megaphone className="h-4 w-4 text-primary" /> Class announcements</p>
                {data.announcements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No announcements yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.announcements.map((a, idx) => (
                      <li key={idx}>
                        <p className="text-sm font-semibold text-foreground">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.courseName} · {fmtDate(a.postedAt)}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-3 whitespace-pre-line">{a.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              This session ends automatically after 30 minutes. For lessons, quizzes and more, your child can sign in with Student Login.
              See our <Link href="/privacy-policy" className="underline">privacy policy</Link>.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
