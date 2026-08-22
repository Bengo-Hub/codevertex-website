'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Flame,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  AlertCircle,
  PlayCircle,
  Phone,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { ReferralCard } from './ReferralCard';
import { fullNameToInitials, useSetStudentIdentity } from './student-identity-context';
import { useStudentSection } from './student-section-context';
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
    cohort: { id: string; name: string; startDate: string | null; endDate: string | null } | null;
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

interface CourseContentLesson {
  id: string;
  title: string;
  type: string;
  isPreview: boolean;
  durationSec: number | null;
  locked: boolean;
  completedAt: string | null;
  lastPositionSec: number | null;
  quiz: { id: string; title: string } | null;
}

interface CourseContentModule {
  id: string;
  title: string;
  description: string | null;
  lessons: CourseContentLesson[];
}

interface CourseContent {
  hasAccess: boolean;
  modules: CourseContentModule[];
  progressPct: number;
  completedLessons: number;
  totalLessons: number;
}

async function fetchCourseContent(studentId: string, courseId: string): Promise<CourseContent> {
  const response = await fetch(
    `/api/students/${encodeURIComponent(studentId)}/courses/${encodeURIComponent(courseId)}/content`,
    { cache: 'no-store' }
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error ?? 'Unable to load course content.');
  }
  return result;
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0 min';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.round((totalSeconds % 3600) / 60);
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const SECTION_META: Record<string, { title: string; description: string }> = {
  overview: { title: 'Overview', description: 'Your learning snapshot at a glance' },
  course: { title: 'My Course', description: 'Track progress on your active enrollment' },
  payments: { title: 'Payments', description: 'Installments and payment history' },
  certificates: { title: 'Certificates', description: 'Credentials you have earned' },
  referrals: { title: 'Refer a Friend', description: 'Share your code, earn rewards' },
  quizzes: { title: 'Quiz Performance', description: 'Every attempt, scored and tracked' },
};

export function StudentDashboard() {
  const router = useRouter();
  const setIdentity = useSetStudentIdentity();
  const { activeSection } = useStudentSection();

  const [data, setData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [content, setContent] = useState<CourseContent | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

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

  // Real curriculum + accurate progress — reuses the same endpoint the learn page uses.
  useEffect(() => {
    if (!data?.student || !data.enrollment) return;
    let cancelled = false;
    setContentLoading(true);
    fetchCourseContent(data.student.id, data.enrollment.courseId)
      .then((result) => {
        if (!cancelled) setContent(result);
      })
      .catch(() => {
        if (!cancelled) setContent(null);
      })
      .finally(() => {
        if (!cancelled) setContentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [data?.student, data?.enrollment]);

  const stats = useMemo(() => {
    if (!data) return null;

    const completedLessons = data.progress.filter((lesson) => lesson.completedAt).length;
    const totalQuizAttempts = data.quizAttempts.length;
    const passedQuizzes = data.quizAttempts.filter((quiz) => quiz.passed).length;
    const quizPassRate = totalQuizAttempts > 0 ? Math.round((passedQuizzes / totalQuizAttempts) * 100) : 0;
    const paidInstallments = data.enrollment?.installments.filter((i) => i.status === 'paid' || i.paidAt).length ?? 0;
    const totalInstallments = data.enrollment?.installments.length ?? 0;
    // Fallback estimate used only until the real curriculum (content.progressPct) has loaded.
    const courseProgressPct = content ? content.progressPct : Math.min(completedLessons * 10, 100);

    return {
      completedLessons: content ? content.completedLessons : completedLessons,
      totalQuizAttempts,
      passedQuizzes,
      quizPassRate,
      paidInstallments,
      totalInstallments,
      courseProgressPct,
    };
  }, [data, content]);

  // Total time watched, derived from durationSec of lessons the student has actually completed —
  // no estimate, just a sum of real recorded lesson lengths.
  const timeInvestedSec = useMemo(() => {
    if (!content) return 0;
    return content.modules
      .flatMap((m) => m.lessons)
      .filter((l) => l.completedAt)
      .reduce((sum, l) => sum + (l.durationSec ?? 0), 0);
  }, [content]);

  // First lesson that isn't completed and isn't locked, in curriculum order — "resume where you left off".
  const nextLesson = useMemo(() => {
    if (!content) return null;
    for (const courseModule of content.modules) {
      for (const lesson of courseModule.lessons) {
        if (!lesson.completedAt && !lesson.locked) {
          return { ...lesson, moduleTitle: courseModule.title };
        }
      }
    }
    return null;
  }, [content]);

  // Merge lesson-completion + quiz-attempt timestamps into one real activity timeline.
  const recentActivity = useMemo(() => {
    if (!data) return [];
    const lessonTitleById = new Map<string, string>();
    const quizTitleById = new Map<string, string>();
    for (const courseModule of content?.modules ?? []) {
      for (const lesson of courseModule.lessons) {
        lessonTitleById.set(lesson.id, lesson.title);
        if (lesson.quiz) quizTitleById.set(lesson.quiz.id, lesson.title);
      }
    }

    const events: { id: string; type: 'lesson' | 'quiz'; label: string; date: string; passed?: boolean }[] = [];

    for (const p of data.progress) {
      if (!p.completedAt) continue;
      events.push({
        id: `lesson-${p.lessonId}`,
        type: 'lesson',
        label: lessonTitleById.get(p.lessonId) ?? 'Lesson completed',
        date: p.completedAt,
      });
    }
    for (const q of data.quizAttempts) {
      events.push({
        id: `quiz-${q.id}`,
        type: 'quiz',
        label: quizTitleById.get(q.quizId) ? `Quiz: ${quizTitleById.get(q.quizId)}` : 'Quiz attempt',
        date: q.createdAt,
        passed: q.passed,
      });
    }

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  }, [data, content]);

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

  const meta = SECTION_META[activeSection] ?? SECTION_META.overview;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {activeSection !== 'overview' && (
        <div className="mb-6">
          <h1 className="text-2xl font-black text-foreground">{meta.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
        </div>
      )}

      {activeSection === 'overview' && (
        <OverviewSection
          data={data}
          stats={stats}
          content={content}
          nextLesson={nextLesson}
          timeInvestedSec={timeInvestedSec}
          recentActivity={recentActivity}
        />
      )}
      {activeSection === 'course' && (
        <CourseSection data={data} stats={stats} content={content} contentLoading={contentLoading} nextLesson={nextLesson} />
      )}
      {activeSection === 'payments' && <PaymentsSection data={data} stats={stats} />}
      {activeSection === 'certificates' && <CertificatesSection data={data} />}
      {activeSection === 'referrals' && <ReferralCard studentId={data.student.id} />}
      {activeSection === 'quizzes' && <QuizzesSection data={data} stats={stats} content={content} />}
    </main>
  );
}

interface Stats {
  completedLessons: number;
  totalQuizAttempts: number;
  passedQuizzes: number;
  quizPassRate: number;
  paidInstallments: number;
  totalInstallments: number;
  courseProgressPct: number;
}

type ActivityEvent = { id: string; type: 'lesson' | 'quiz'; label: string; date: string; passed?: boolean };
type NextLesson = CourseContentLesson & { moduleTitle: string };
type Installment = NonNullable<StudentData['enrollment']>['installments'][number];

function findNextDueInstallment(installments: Installment[]) {
  return installments
    .filter((i) => i.status !== 'paid' && !i.paidAt)
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })[0];
}

function PaymentDueBanner({ data }: { data: StudentData }) {
  const { setActiveSection } = useStudentSection();
  if (!data.enrollment || data.enrollment.installments.length === 0) return null;

  const nextDue = findNextDueInstallment(data.enrollment.installments);
  if (!nextDue) return null;

  const isOverdue = nextDue.status === 'overdue';
  const daysUntilDue = nextDue.dueDate
    ? Math.ceil((new Date(nextDue.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <button
      type="button"
      onClick={() => setActiveSection('payments')}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
        isOverdue
          ? 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10'
          : 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10'
      }`}
    >
      <span className="flex items-center gap-2.5">
        {isOverdue ? (
          <XCircle className="h-4 w-4 shrink-0 text-destructive" />
        ) : (
          <Clock className="h-4 w-4 shrink-0 text-amber-500" />
        )}
        <span>
          <span className="font-semibold text-foreground">
            {isOverdue ? 'Installment overdue' : 'Upcoming installment'}
          </span>{' '}
          <span className="text-muted-foreground">
            — {formatCurrency(nextDue.amount, nextDue.currency)}
            {nextDue.dueDate &&
              (isOverdue
                ? ` was due ${new Date(nextDue.dueDate).toLocaleDateString()}`
                : daysUntilDue !== null && daysUntilDue >= 0
                  ? ` due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`
                  : ` due ${new Date(nextDue.dueDate).toLocaleDateString()}`)}
          </span>
        </span>
      </span>
      <span className="shrink-0 text-xs font-semibold text-primary">View payments →</span>
    </button>
  );
}

function OverviewSection({
  data,
  stats,
  content,
  nextLesson,
  timeInvestedSec,
  recentActivity,
}: {
  data: StudentData;
  stats: Stats;
  content: CourseContent | null;
  nextLesson: NextLesson | null;
  timeInvestedSec: number;
  recentActivity: ActivityEvent[];
}) {
  const router = useRouter();
  const { setActiveSection } = useStudentSection();
  const { completedLessons, quizPassRate, courseProgressPct } = stats;

  return (
    <div className="space-y-8">
      {/* Payment reminder */}
      <PaymentDueBanner data={data} />

      {/* Hero */}
      <motion.section initial="hidden" animate="show" custom={0} variants={fadeUp}>
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
                <h1 className="text-2xl font-black sm:text-3xl">Hi, {data.student.fullName.split(' ')[0]} 👋</h1>
                <p className="mt-1 text-sm text-white/75">
                  {nextLesson
                    ? `Up next: ${nextLesson.title}`
                    : data.enrollment
                      ? `Continue your ${data.enrollment.courseName} journey`
                      : 'Ready to start learning?'}
                </p>
              </div>
            </div>

            {data.enrollment && (
              <button
                onClick={() => router.push(`/digitika/${data.enrollment?.courseId}/learn`)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl"
              >
                <BookOpen className="h-4 w-4" />
                {nextLesson ? 'Resume Learning' : 'Continue Learning'}
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
            value={content ? `${completedLessons} / ${content.totalLessons}` : completedLessons.toString()}
            accent="from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            index={2}
            icon={<Clock className="h-5 w-5" />}
            title="Time Invested"
            value={formatDuration(timeInvestedSec)}
            accent="from-blue-500/15 to-blue-500/5 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            index={3}
            icon={<Award className="h-5 w-5" />}
            title="Certificates"
            value={data.certificates.length.toString()}
            accent="from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400"
          />
        </div>
      </motion.section>

      {/* Progress + quick jump */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.button
          type="button"
          onClick={() => setActiveSection('course')}
          className="text-left lg:col-span-2"
          initial="hidden"
          animate="show"
          custom={1}
          variants={fadeUp}
        >
          <div className="h-full rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/30">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Course Progress</h2>
                <p className="text-sm text-muted-foreground">
                  {data.enrollment ? data.enrollment.courseName : 'No active enrollment'}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Target className="h-5 w-5" />
              </div>
            </div>

            {data.enrollment ? (
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">
                    {content ? `${completedLessons} of ${content.totalLessons} lessons completed` : `${completedLessons} lessons completed`}
                  </span>
                  <span className="font-semibold text-foreground">{courseProgressPct}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent-foreground"
                    initial={{ width: 0 }}
                    animate={{ width: `${courseProgressPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                {nextLesson && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <PlayCircle className="h-3.5 w-3.5 text-primary" />
                    Next: {nextLesson.title} <span className="text-muted-foreground/70">({nextLesson.moduleTitle})</span>
                  </p>
                )}
                <p className="mt-3 text-xs font-medium text-primary">View full course details →</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Browse courses to get started.</p>
            )}
          </div>
        </motion.button>

        <motion.div initial="hidden" animate="show" custom={2} variants={fadeUp}>
          <div className="h-full rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Quiz Pass Rate</h2>
            </div>
            {stats.totalQuizAttempts === 0 ? (
              <p className="text-sm text-muted-foreground">No quiz attempts yet.</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xl font-black text-primary">{quizPassRate}%</span>
                </div>
                <div>
                  <p className="font-semibold">{stats.passedQuizzes} passed</p>
                  <p className="text-sm text-muted-foreground">{stats.totalQuizAttempts} attempts</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setActiveSection('quizzes')}
              className="mt-4 text-xs font-medium text-primary hover:underline"
            >
              View quiz history →
            </button>
          </div>
        </motion.div>
      </div>

      {/* Recent activity + profile */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div className="lg:col-span-2" initial="hidden" animate="show" custom={3} variants={fadeUp}>
          <div className="h-full rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 font-bold">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing recorded yet — complete a lesson or take a quiz to see activity here.
              </p>
            ) : (
              <ul className="space-y-3">
                {recentActivity.map((event) => (
                  <li key={event.id} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        event.type === 'quiz'
                          ? event.passed
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-destructive/10 text-destructive'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {event.type === 'quiz' ? <Trophy className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{event.label}</p>
                      <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>

        <motion.div initial="hidden" animate="show" custom={4} variants={fadeUp}>
          <div className="h-full rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 font-bold">Profile</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{data.student.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{data.student.phone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Member since {new Date(data.student.createdAt).toLocaleDateString()}</span>
              </div>
              {data.enrollment?.cohort?.startDate && (
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">
                    Cohort starts {new Date(data.enrollment.cohort.startDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function CourseSection({
  data,
  stats,
  content,
  contentLoading,
  nextLesson,
}: {
  data: StudentData;
  stats: Stats;
  content: CourseContent | null;
  contentLoading: boolean;
  nextLesson: NextLesson | null;
}) {
  const router = useRouter();
  const { completedLessons, courseProgressPct } = stats;
  const cohort = data.enrollment?.cohort;

  return (
    <motion.section initial="hidden" animate="show" custom={0} variants={fadeUp}>
      <div className="rounded-2xl border border-border bg-card p-6">
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

            {cohort && (
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Cohort: {cohort.name}
                </span>
                {cohort.startDate && (
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Starts {new Date(cohort.startDate).toLocaleDateString()}
                  </span>
                )}
                {cohort.endDate && (
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Ends {new Date(cohort.endDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <Target className="h-4 w-4 text-primary" /> Learning Progress
                </span>
                <span className="font-semibold text-foreground">
                  {content ? `${completedLessons} of ${content.totalLessons} lessons` : `${completedLessons} lessons completed`}
                </span>
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
              {nextLesson ? `Resume: ${nextLesson.title}` : 'Continue Learning'}
            </button>

            {/* Curriculum */}
            <div className="mt-8">
              <h3 className="mb-3 text-sm font-bold text-foreground">Curriculum</h3>

              {contentLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/50" />
                  ))}
                </div>
              ) : !content || content.modules.length === 0 ? (
                <p className="text-sm text-muted-foreground">Curriculum for this course hasn't been published yet.</p>
              ) : (
                <div className="space-y-5">
                  {content.modules.map((courseModule) => (
                    <div key={courseModule.id}>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {courseModule.title}
                      </p>
                      <div className="overflow-hidden rounded-xl border border-border">
                        {courseModule.lessons.map((lesson, idx) => {
                          const isDone = Boolean(lesson.completedAt);
                          const isNext = nextLesson?.id === lesson.id;
                          return (
                            <div
                              key={lesson.id}
                              className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${
                                idx !== 0 ? 'border-t border-border' : ''
                              } ${isNext ? 'bg-primary/5' : ''}`}
                            >
                              <span className="flex min-w-0 items-center gap-2.5">
                                {isDone ? (
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                ) : lesson.locked ? (
                                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                                ) : (
                                  <PlayCircle className={`h-4 w-4 shrink-0 ${isNext ? 'text-primary' : 'text-muted-foreground'}`} />
                                )}
                                <span
                                  className={`truncate ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'} ${isNext ? 'font-semibold' : ''}`}
                                >
                                  {lesson.title}
                                </span>
                              </span>
                              {lesson.durationSec != null && (
                                <span className="shrink-0 text-xs text-muted-foreground">{formatDuration(lesson.durationSec)}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
  );
}

function PaymentsSection({ data, stats }: { data: StudentData; stats: Stats }) {
  const { paidInstallments, totalInstallments } = stats;

  return (
    <motion.section initial="hidden" animate="show" custom={0} variants={fadeUp}>
      <div className="rounded-2xl border border-border bg-card p-6">
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
              <>
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

                <div className="mt-6 overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-semibold">#</th>
                        <th className="px-4 py-2.5 text-left font-semibold">Amount</th>
                        <th className="px-4 py-2.5 text-left font-semibold">Due date</th>
                        <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.enrollment.installments
                        .slice()
                        .sort((a, b) => a.installmentNo - b.installmentNo)
                        .map((installment) => (
                          <tr key={installment.id}>
                            <td className="px-4 py-2.5 font-medium">{installment.installmentNo}</td>
                            <td className="px-4 py-2.5">{formatCurrency(installment.amount, installment.currency)}</td>
                            <td className="px-4 py-2.5 text-muted-foreground">
                              {installment.dueDate ? new Date(installment.dueDate).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-4 py-2.5">
                              {installment.status === 'paid' || installment.paidAt ? (
                                <Badge variant="success" className="gap-1 py-0.5 text-[11px]">
                                  <CheckCircle2 className="h-3 w-3" /> Paid
                                </Badge>
                              ) : installment.status === 'overdue' ? (
                                <Badge variant="destructive" className="gap-1 py-0.5 text-[11px]">
                                  <XCircle className="h-3 w-3" /> Overdue
                                </Badge>
                              ) : (
                                <Badge variant="warning" className="gap-1 py-0.5 text-[11px]">
                                  <Clock className="h-3 w-3" /> Pending
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No enrollment found.</p>
        )}
      </div>
    </motion.section>
  );
}

function CertificatesSection({ data }: { data: StudentData }) {
  return (
    <motion.section initial="hidden" animate="show" custom={0} variants={fadeUp}>
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
                  <p className="text-xs text-muted-foreground">
                    Issued {new Date(certificate.issuedAt).toLocaleDateString()}
                  </p>
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
  );
}

function QuizzesSection({ data, stats, content }: { data: StudentData; stats: Stats; content: CourseContent | null }) {
  const { quizPassRate, passedQuizzes, totalQuizAttempts } = stats;

  const quizTitleById = new Map<string, string>();
  for (const courseModule of content?.modules ?? []) {
    for (const lesson of courseModule.lessons) {
      if (lesson.quiz) quizTitleById.set(lesson.quiz.id, lesson.title);
    }
  }

  return (
    <motion.section initial="hidden" animate="show" custom={0} variants={fadeUp}>
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="font-bold">Quiz Performance</h2>
        </div>

        {totalQuizAttempts === 0 ? (
          <EmptyState icon={<Flame className="h-10 w-10" />} message="No quiz attempts yet — take your first quiz!" />
        ) : (
          <>
            <div className="flex items-center gap-5">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <span className="text-xl font-black text-primary">{quizPassRate}%</span>
              </div>
              <div>
                <p className="font-semibold">{passedQuizzes} quizzes passed</p>
                <p className="text-sm text-muted-foreground">{totalQuizAttempts} total attempts</p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">Quiz</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Score</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Result</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.quizAttempts
                    .slice()
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((attempt) => (
                      <tr key={attempt.id}>
                        <td className="px-4 py-2.5 font-medium">{quizTitleById.get(attempt.quizId) ?? attempt.quizId}</td>
                        <td className="px-4 py-2.5">{attempt.scorePct}%</td>
                        <td className="px-4 py-2.5">
                          {attempt.passed ? (
                            <Badge variant="success" className="gap-1 py-0.5 text-[11px]">
                              <CheckCircle2 className="h-3 w-3" /> Passed
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1 py-0.5 text-[11px]">
                              <XCircle className="h-3 w-3" /> Failed
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {new Date(attempt.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </motion.section>
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
