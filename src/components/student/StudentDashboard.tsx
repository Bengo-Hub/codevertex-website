'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  CreditCard,
  Award,
  CheckCircle,
  Clock,
  LogOut,
  User,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReferralCard } from './ReferralCard';

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
    cohort: {
      id: string;
      name: string;
    } | null;
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

export function StudentDashboard() {
  const router = useRouter();

  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch('/api/students/me', {
          cache: 'no-store',
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error ?? 'Unable to load student portal.');
          return;
        }

        setData(result);
      } catch {
        setError('Unable to connect to the student portal.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function logout() {
    try {
      await fetch('/api/auth/session', {
        method: 'DELETE',
      });
    } finally {
      router.push('/');
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading student portal...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />

          <h1 className="text-xl font-bold">
            Unable to Load Portal
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const completedLessons = data.progress.filter(
    (lesson) => lesson.completedAt
  ).length;

  const totalQuizAttempts = data.quizAttempts.length;

  const passedQuizzes = data.quizAttempts.filter(
    (quiz) => quiz.passed
  ).length;

  const progressPercentage =
    totalQuizAttempts > 0
      ? Math.round((passedQuizzes / totalQuizAttempts) * 100)
      : 0;

  const paidInstallments =
    data.enrollment?.installments.filter(
      (item) => item.status === 'paid' || item.paidAt
    ).length ?? 0;

  const totalInstallments =
    data.enrollment?.installments.length ?? 0;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>

            <div>
              <h1 className="font-bold text-foreground">
                Student Portal
              </h1>

              <p className="text-xs text-muted-foreground">
                Codevertex Africa
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <section className="mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>

            <div>
              <h2 className="text-2xl font-black">
                Welcome, {data.student.fullName}
              </h2>

              <p className="text-sm text-muted-foreground">
                Student ID: {data.student.id}
              </p>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<BookOpen className="h-5 w-5" />}
            title="Course"
            value={data.enrollment?.courseName ?? 'No enrollment'}
          />

          <StatCard
            icon={<CheckCircle className="h-5 w-5" />}
            title="Lessons Completed"
            value={completedLessons.toString()}
          />

          <StatCard
            icon={<Award className="h-5 w-5" />}
            title="Certificates"
            value={data.certificates.length.toString()}
          />

          <StatCard
            icon={<CreditCard className="h-5 w-5" />}
            title="Payment"
            value={
              data.enrollment?.paymentStatus ?? 'Not enrolled'
            }
          />
        </section>

        {/* Course */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold">
                  My Course
                </h2>

                <p className="text-sm text-muted-foreground">
                  Your current enrollment
                </p>
              </div>

              <BookOpen className="h-6 w-6 text-primary" />
            </div>

            {data.enrollment ? (
              <div>
                <h3 className="text-xl font-bold">
                  {data.enrollment.courseName}
                </h3>

                <p className="text-sm text-muted-foreground mt-1">
                  {data.enrollment.category}
                </p>

                {data.enrollment.cohort && (
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Cohort: {data.enrollment.cohort.name}
                  </div>
                )}

                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Learning Progress</span>
                    <span>{completedLessons} lessons completed</span>
                  </div>

                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          completedLessons * 10,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={() =>
                    router.push(
                      `/digitika/${data.enrollment?.courseId}/learn`
                    )
                  }
                  className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
                >
                  Continue Learning
                </button>
              </div>
            ) : (
              <div className="py-8 text-center">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground" />

                <p className="mt-3 text-sm text-muted-foreground">
                  You currently have no course enrollment.
                </p>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold">
                Payment Status
              </h2>

              <CreditCard className="h-5 w-5 text-primary" />
            </div>

            {data.enrollment ? (
              <>
                <div className="text-2xl font-black">
                  {data.enrollment.currency}{' '}
                  {data.enrollment.totalAmount?.toLocaleString() ??
                    data.enrollment.amount.toLocaleString()}
                </div>

                <p className="text-sm text-muted-foreground mt-1">
                  {data.enrollment.paymentPlan ??
                    'Payment plan not specified'}
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm">
                  {data.enrollment.paymentStatus === 'succeeded' ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Payment complete
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-orange-500" />
                      Payment pending
                    </>
                  )}
                </div>

                {totalInstallments > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {paidInstallments} of {totalInstallments}{' '}
                    installments paid
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No enrollment found.
              </p>
            )}
          </div>
        </section>

        {/* Certificates */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Award className="h-5 w-5 text-primary" />
            <h2 className="font-bold">
              My Certificates
            </h2>
          </div>

          {data.certificates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No certificates have been issued yet.
            </p>
          ) : (
            <div className="space-y-3">
              {data.certificates.map((certificate) => (
                <div
                  key={certificate.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border p-4"
                >
                  <div>
                    <p className="font-semibold">
                      {certificate.courseName}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {certificate.certificateNumber}
                    </p>
                  </div>

                  <a
                    href={`/certificates/${certificate.verifyToken}`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    View Certificate
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        <ReferralCard studentId={data.student.id} />

        {/* Quiz */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-bold mb-5">
            Quiz Performance
          </h2>

          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-black text-primary">
                {progressPercentage}%
              </span>
            </div>

            <div>
              <p className="font-semibold">
                {passedQuizzes} quizzes passed
              </p>

              <p className="text-sm text-muted-foreground">
                {totalQuizAttempts} total attempts
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {title}
          </p>

          <p className="font-bold truncate">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}