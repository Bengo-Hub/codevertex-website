'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  CreditCard,
  Flame,
  GraduationCap,
  Loader2,
  AlertCircle,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { ReferralCard } from './ReferralCard';
import { fullNameToInitials, useSetStudentIdentity } from './student-identity-context';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface StudentData {
  student: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    createdAt: string;
  };
  enrollment: {
    id: string;
    courseId: string;
    courseName: string;
    category: string;
    paymentStatus: string;
    paymentPlan: string | null;
    amount: number;
    totalAmount: number | null;
    currency: string;
    cohort: { id: string; name: string } | null;
    installments: {
      id: string;
      installmentNo: number;
      amount: number;
      currency: string;
      status: string;
      dueDate: string | null;
      paidAt: string | null;
    }[];
  } | null;
  progress: {
    lessonId: string;
    completedAt: string | null;
    lastPositionSec: number | null;
  }[];
  quizAttempts: {
    id: string;
    quizId: string;
    scorePct: number;
    passed: boolean;
    createdAt: string;
  }[];
  certificates: {
    id: string;
    certificateNumber: string;
    verifyToken: string;
    courseId: string;
    courseName: string;
    issuedAt: string;
  }[];
}

async function fetchStudentData(): Promise<StudentData> {
  const response = await fetch('/api/students/me', { cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error ?? 'Unable to load student portal.');
  }
  return result;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function StudentDashboard() {
  const router = useRouter();
  const setIdentity = useSetStudentIdentity();

  const [data, setData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchStudentData();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error('Unable to connect to the student portal.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (data?.student) {
      setIdentity({ name: data.student.fullName, initials: fullNameToInitials(data.student.fullName) });
    }
    return () => setIdentity(null);
  }, [data?.student, setIdentity]);

  const stats = useMemo(() => {
    if (!data) return null;

    const completedLessons = data.progress.filter((lesson) => lesson.completedAt).length;
    const totalQuizAttempts = data.quizAttempts.length;
    const passedQuizzes = data.quizAttempts.filter((quiz) => quiz.passed).length;
    const quizPassRate = totalQuizAttempts > 0 ? Math.round((passedQuizzes / totalQuizAttempts) * 100) : 0;
    const paidInstallments = data.enrollment?.installments.filter((i) => i.status === 'paid' || i.paidAt).length ?? 0;
    const totalInstallments = data.enrollment?.installments.length ?? 0;
    const courseProgressPct = Math.min(completedLessons * 10, 100);

    return {
      completedLessons,
      totalQuizAttempts,
      passedQuizzes,
      quizPassRate,
      paidInstallments,
      totalInstallments,
      courseProgressPct,
    };
  }, [data]);

  if (isLoading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your student portal…</p>
        </div>
      </main>
    );
  }

  if (error || !data || !stats) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" />
          <h1 className="text-xl font-bold">Unable to Load Portal</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Unable to connect to the student portal.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const { completedLessons, totalQuizAttempts, passedQuizzes, quizPassRate, paidInstallments, totalInstallments, courseProgressPct } =
    stats;

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* ===== Overview / Hero ===== */}
      <motion.section
        id="overview"
        className="scroll-mt-24"
        initial="hidden"
        animate="show"
        custom={0}
        variants={fadeUp}
      >
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary via-primary to-accent-foreground p-6 text-primary-foreground sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/70">
                  <Sparkles className="h-3.5 w-3.5" /> Welcome back
                </p>
                <h1 className="text-2xl font-black sm:text-3xl">{data.student.fullName}</h1>
                <p className="mt-1 text-sm text-white/75">Student ID: {data.student.id}</p>
              </div>
            </div>

            {data.enrollment && (
              <button
                onClick={() => router.push(`/digitika/${data.enrollment?.courseId}/learn`)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl"
              >
                <BookOpen className="h-4 w-4" />
                Continue Learning
              </button>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            index={0}
            icon={<BookOpen className="h-5 w-5" />}
            title="Course"
            value={data.enrollment?.courseName ?? 'Not enrolled'}
            accent="from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-400"
          />
          <StatCard
            index={1}
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Lessons Completed"
            value={completedLessons.toString()}
            accent="from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            index={2}
            icon={<Award className="h-5 w-5" />}
            title="Certificates"
            value={data.certificates.length.toString()}
            accent="from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            index={3}
            icon={<CreditCard className="h-5 w-5" />}
            title="Payment"
            value={data.enrollment?.paymentStatus ?? 'Not enrolled'}
            accent="from-sky-500/15 to-sky-500/5 text-sky-600 dark:text-sky-400"
          />
        </div>
      </motion.section>

      {/* ===== Course + Payment ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.section
          id="course"
          className="scroll-mt-24 lg:col-span-2"
          initial="hidden"
          animate="show"
          custom={1}
          variants={fadeUp}
        >
          <div className="h-full rounded-2xl border border-border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">My Course</h2>
                <p className="text-sm text-muted-foreground">Your current enrollment</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>

            {data.enrollment ? (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold">{data.enrollment.courseName}</h3>
                  <Badge variant="outline">{data.enrollment.category}</Badge>
                </div>

                {data.enrollment.cohort && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Cohort: {data.enrollment.cohort.name}
                  </div>
                )}

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Target className="h-4 w-4 text-primary" /> Learning Progress
                    </span>
                    <span className="font-semibold text-foreground">{completedLessons} lessons completed</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent-foreground"
                      initial={{ width: 0 }}
                      animate={{ width: `${courseProgressPct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/digitika/${data.enrollment?.courseId}/learn`)}
                  className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Continue Learning
                </button>
              </div>
            ) : (
              <EmptyState
                icon={<BookOpen className="h-10 w-10" />}
                message="You currently have no course enrollment."
                actionLabel="Browse Courses"
                onAction={() => router.push('/digitika')}
              />
            )}
          </div>
        </motion.section>

        <motion.section id="payments" className="scroll-mt-24" initial="hidden" animate="show" custom={2} variants={fadeUp}>
          <div className="h-full rounded-2xl border border-border bg-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold">Payment Status</h2>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>

            {data.enrollment ? (
              <>
                <div className="text-2xl font-black">
                  {formatCurrency(data.enrollment.totalAmount ?? data.enrollment.amount, data.enrollment.currency)}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.enrollment.paymentPlan ?? 'Payment plan not specified'}
                </p>

                <div className="mt-5">
                  {data.enrollment.paymentStatus === 'succeeded' ? (
                    <Badge variant="success" className="gap-1.5 py-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Payment complete
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="gap-1.5 py-1">
                      <Clock className="h-3.5 w-3.5" /> Payment pending
                    </Badge>
                  )}
                </div>

                {totalInstallments > 0 && (
                  <div className="mt-5">
                    <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                      <span>Installments</span>
                      <span className="font-semibold text-foreground">
                        {paidInstallments} of {totalInstallments} paid
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${totalInstallments ? (paidInstallments / totalInstallments) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No enrollment found.</p>
            )}
          </div>
        </motion.section>
      </div>

      {/* ===== Certificates ===== */}
      <motion.section id="certificates" className="scroll-mt-24" initial="hidden" animate="show" custom={3} variants={fadeUp}>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <h2 className="font-bold">My Certificates</h2>
          </div>

          {data.certificates.length === 0 ? (
            <EmptyState icon={<Award className="h-10 w-10" />} message="No certificates have been issued yet." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.certificates.map((certificate) => (
                <div
                  key={certificate.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{certificate.courseName}</p>
                    <p className="text-xs text-muted-foreground">{certificate.certificateNumber}</p>
                  </div>
                  <a
                    href={`/certificates/${certificate.verifyToken}`}
                    className="shrink-0 text-sm font-semibold text-primary hover:underline"
                  >
                    View →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* ===== Referrals + Quiz Performance ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.section id="referrals" className="scroll-mt-24" initial="hidden" animate="show" custom={4} variants={fadeUp}>
          <ReferralCard studentId={data.student.id} />
        </motion.section>

        <motion.section id="quizzes" className="scroll-mt-24" initial="hidden" animate="show" custom={5} variants={fadeUp}>
          <div className="h-full rounded-2xl border border-border bg-card p-6">
            <div className="mb-5 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Quiz Performance</h2>
            </div>

            {totalQuizAttempts === 0 ? (
              <EmptyState icon={<Flame className="h-10 w-10" />} message="No quiz attempts yet — take your first quiz!" />
            ) : (
              <div className="flex items-center gap-5">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xl font-black text-primary">{quizPassRate}%</span>
                </div>
                <div>
                  <p className="font-semibold">{passedQuizzes} quizzes passed</p>
                  <p className="text-sm text-muted-foreground">{totalQuizAttempts} total attempts</p>
                </div>
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  title,
  value,
  accent,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  accent: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
      className="rounded-2xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="truncate font-bold capitalize">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({
  icon,
  message,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
      {icon}
      <p className="mt-3 text-sm">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
