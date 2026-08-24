'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Bell,
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
  Search,
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
import { authedFetch } from '@/lib/auth/authed-fetch';

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
  const response = await authedFetch('/api/students/me', { cache: 'no-store' });
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

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
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
  overview: { title: 'Dashboard', description: 'Your learning snapshot at a glance' },
  course: { title: 'My Course', description: 'Track progress on your active enrollment' },
  payments: { title: 'Payments', description: 'Installments and payment history' },
  certificates: { title: 'Certificates', description: 'Credentials you have earned' },
  referrals: { title: 'Refer a Friend', description: 'Share your code, earn rewards' },
  quizzes: { title: 'Quiz Performance', description: 'Every attempt, scored and tracked' },
};

export function StudentDashboard() {
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
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <TopBar title={meta.title} initials={fullNameToInitials(data.student.fullName)} />

      {activeSection !== 'overview' && (
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">{meta.description}</p>
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

function TopBar({ title, initials }: { title: string; initials: string }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-2xl font-black text-foreground">{title}</h1>
      <div className="flex items-center gap-2">
        <button className="hidden h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground sm:flex">
          <Search className="h-4 w-4" />
        </button>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
        </button>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
          {initials}
        </span>
      </div>
    </div>
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
  const { completedLessons, courseProgressPct } = stats;
  const totalLessons = content?.totalLessons ?? 0;
  const remainingLessons = Math.max(totalLessons - completedLessons, 0);

  const today = new Date();
  const monthLabel = today.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  const calendarDays = useMemo(() => buildCalendarWeeks(today), []);
  const nextDue = data.enrollment ? findNextDueInstallment(data.enrollment.installments) : undefined;

  // Split bar: completed vs in-progress vs untouched, as % of total lessons.
  const completedPct = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const inProgressPct = totalLessons ? Math.min(100 - completedPct, remainingLessons > 0 ? 8 : 0) : 0;

  const scheduleItems = useMemo(() => {
    const items: { id: string; title: string; subtitle: string; icon: React.ReactNode; tone: string }[] = [];
    if (nextLesson) {
      items.push({
        id: 'next-lesson',
        title: nextLesson.title,
        subtitle: `${nextLesson.moduleTitle} · Up next`,
        icon: <PlayCircle className="h-4 w-4" />,
        tone: 'bg-primary/10 text-primary',
      });
    }
    if (nextDue) {
      items.push({
        id: 'next-due',
        title: `Installment due — ${formatCurrency(nextDue.amount, nextDue.currency)}`,
        subtitle: nextDue.dueDate ? new Date(nextDue.dueDate).toLocaleDateString() : 'Date pending',
        icon: <CreditCard className="h-4 w-4" />,
        tone: 'bg-amber-500/10 text-amber-600',
      });
    }
    for (const event of recentActivity.slice(0, 3)) {
      items.push({
        id: event.id,
        title: event.label,
        subtitle: new Date(event.date).toLocaleDateString(),
        icon: event.type === 'quiz' ? <Trophy className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />,
        tone: event.type === 'quiz'
          ? event.passed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'
          : 'bg-primary/10 text-primary',
      });
    }
    return items.slice(0, 5);
  }, [nextLesson, nextDue, recentActivity]);

  return (
    <div className="space-y-5">
      <PaymentDueBanner data={data} />

      {/* Row 1: activity chart + calendar */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div
          className="rounded-2xl border border-border bg-card p-6 lg:col-span-2"
          initial="hidden"
          animate="show"
          custom={0}
          variants={fadeUp}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">My Learning Activity</h2>
              <p className="text-xs text-muted-foreground">
                {formatDuration(timeInvestedSec)} invested so far
              </p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              This course
            </span>
          </div>
          <ActivitySparkline completed={completedLessons} total={Math.max(totalLessons, 1)} />
        </motion.div>

        <motion.div
          className="rounded-2xl border border-border bg-card p-5"
          initial="hidden"
          animate="show"
          custom={1}
          variants={fadeUp}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">{today.toLocaleDateString(undefined, { month: 'long' })}</h2>
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={`${d}-${i}`}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => (
              <span
                key={i}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                  day === null
                    ? ''
                    : day === today.getDate()
                      ? 'bg-primary font-bold text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                }`}
              >
                {day ?? ''}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Today, {monthLabel}</p>
        </motion.div>
      </div>

      {/* Row 2: progress stats + upcoming schedule */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div
          className="rounded-2xl border border-border bg-card p-6"
          initial="hidden"
          animate="show"
          custom={2}
          variants={fadeUp}
        >
          <h2 className="text-sm font-bold text-foreground">Progress Statistics</h2>
          <p className="mt-1 text-xs text-muted-foreground">Total activity</p>
          <p className="mt-2 text-4xl font-black text-foreground">{courseProgressPct}%</p>

          {/* Split bar: completed (primary) + in-progress (amber) + remaining (muted) */}
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${completedPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
            <motion.div
              className="h-full bg-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${inProgressPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] font-medium text-muted-foreground">
            <span>{completedPct}%</span>
            <span>{100 - completedPct}%</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-primary/10 px-3 py-3 text-center">
              <p className="text-lg font-bold text-primary">{remainingLessons}</p>
              <p className="text-[11px] font-medium text-primary/80">In progress</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 px-3 py-3 text-center">
              <p className="text-lg font-bold text-emerald-600">{completedLessons}</p>
              <p className="text-[11px] font-medium text-emerald-600/80">Completed</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="rounded-2xl border border-border bg-card p-5 lg:col-span-2"
          initial="hidden"
          animate="show"
          custom={3}
          variants={fadeUp}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Upcoming Schedule</h2>
            <button onClick={() => setActiveSection('course')} className="text-xs font-medium text-primary hover:underline">
              View all →
            </button>
          </div>
          {scheduleItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing scheduled — you're all caught up.</p>
          ) : (
            <ul className="space-y-2">
              {scheduleItems.map((item) => (
                <li key={item.id} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.tone}`}>
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>

      {/* Row 3: My Courses */}
      <motion.div initial="hidden" animate="show" custom={4} variants={fadeUp}>
        <MyCoursesCard data={data} stats={stats} content={content} router={router} />
      </motion.div>
    </div>
  );
}

function MyCoursesCard({
  data,
  stats,
  content,
  router,
}: {
  data: StudentData;
  stats: Stats;
  content: CourseContent | null;
  router: ReturnType<typeof useRouter>;
}) {
  const [tab, setTab] = useState<'all' | 'ongoing' | 'completed'>('all');
  const { completedLessons, courseProgressPct } = stats;
  const isCompleted = courseProgressPct >= 100;
  const visible = !data.enrollment
    ? false
    : tab === 'all' || (tab === 'ongoing' && !isCompleted) || (tab === 'completed' && isCompleted);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-foreground">My Courses</h2>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {(['all', 'ongoing', 'completed'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${
                tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {visible && data.enrollment ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{data.enrollment.courseName}</p>
              <p className="text-xs text-muted-foreground">
                {content ? `${completedLessons} of ${content.totalLessons} lessons` : `${completedLessons} lessons completed`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${courseProgressPct}%` }} />
            </div>
            <span className="text-xs font-semibold text-foreground">{courseProgressPct}%</span>
            <button
              onClick={() => router.push(`/digitika/${data.enrollment?.courseId}/learn`)}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
            >
              View Course
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {data.enrollment ? 'No courses match this filter.' : 'No active course yet.'}
        </p>
      )}
    </div>
  );
}

function ActivitySparkline({ completed, total }: { completed: number; total: number }) {
  const pct = Math.min(Math.max(completed / total, 0), 1);
  const points = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => {
    const eased = pct * (0.4 + 0.6 * t);
    return 60 - eased * 45;
  });
  const path = points.map((y, i) => `${i === 0 ? 'M' : 'L'} ${i * 56} ${y}`).join(' ');
  const areaPath = `${path} L 280 60 L 0 60 Z`;

  return (
    <svg viewBox="0 0 280 60" className="h-24 w-full" preserveAspectRatio="none">
      <path d={areaPath} fill="var(--color-primary)" opacity="0.12" />
      <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function buildCalendarWeeks(today: Date): (number | null)[] {
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
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
                  className="h-full rounded-full bg-primary"
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