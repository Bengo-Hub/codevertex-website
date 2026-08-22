'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Search, Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface CourseOption {
  id: string;
  name: string;
  price: number;
  currency: string;
}

interface CohortOption {
  id: string;
  name: string;
  maxSlots: number;
  status: string;
  _count: { enrollments: number };
}

interface StudentOption {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function AdminEnrollModal({ onClose, onCreated }: Props) {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [cohorts, setCohorts] = useState<CohortOption[]>([]);

  const [courseId, setCourseId] = useState('');
  const [cohortId, setCohortId] = useState('');

  // Student: search existing, or switch to "new student" mode.
  const [mode, setMode] = useState<'search' | 'new'>('search');
  const [studentQuery, setStudentQuery] = useState('');
  const [studentResults, setStudentResults] = useState<StudentOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [paymentPlan, setPaymentPlan] = useState('upfront');
  const [markAsPaid, setMarkAsPaid] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedCourse = useMemo(() => courses.find((c) => c.id === courseId) ?? null, [courses, courseId]);

  // Load course list once.
  useEffect(() => {
    fetch('/api/admin/courses')
      .then((r) => r.json())
      .then((list: CourseOption[]) => setCourses(list))
      .catch(() => setCourses([]));
  }, []);

  // Prefill amount whenever the course changes, unless the admin already typed a custom one.
  useEffect(() => {
    if (selectedCourse) setTotalAmount(selectedCourse.price);
    setCohortId('');
    setCohorts([]);
  }, [selectedCourse]);

  // Load cohorts for the selected course.
  useEffect(() => {
    if (!courseId) return;
    fetch(`/api/admin/cohorts?courseId=${encodeURIComponent(courseId)}`)
      .then((r) => r.json())
      .then((list: CohortOption[]) => setCohorts(list.filter((c) => c.status === 'open')))
      .catch(() => setCohorts([]));
  }, [courseId]);

  // Debounced student search.
  useEffect(() => {
    if (mode !== 'search' || studentQuery.trim().length < 2) {
      setStudentResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      fetch(`/api/admin/students?search=${encodeURIComponent(studentQuery)}&limit=6`)
        .then((r) => r.json())
        .then((json) => setStudentResults(json.items ?? []))
        .catch(() => setStudentResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [studentQuery, mode]);

  const canSubmit =
    courseId &&
    totalAmount !== '' &&
    (selectedStudent || (mode === 'new' && fullName.trim() && email.trim() && phone.trim()));

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(selectedStudent
            ? { studentId: selectedStudent.id }
            : { fullName: fullName.trim(), email: email.trim(), phone: phone.trim() }),
          courseId,
          cohortId: cohortId || undefined,
          totalAmount: Number(totalAmount),
          paymentPlan,
          markAsPaid,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof result?.error === 'string' ? result.error : 'Could not create enrollment.');
        return;
      }
      toast.success(`Enrolled ${selectedStudent?.fullName ?? fullName} — student ID ${result.studentId}`);
      onCreated();
      onClose();
    } catch {
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">New Enrollment</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Student */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student</label>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'search' ? 'new' : 'search');
                  setSelectedStudent(null);
                }}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {mode === 'search' ? 'New student instead' : 'Search existing instead'}
              </button>
            </div>

            {mode === 'search' ? (
              selectedStudent ? (
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{selectedStudent.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedStudent.email} · {selectedStudent.id}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="shrink-0 text-xs font-medium text-muted-foreground hover:text-destructive"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    placeholder="Search by name, email, or student ID…"
                    className={`${inputCls} pl-9`}
                  />
                  {(searching || studentResults.length > 0) && (
                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                      {searching ? (
                        <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
                        </div>
                      ) : (
                        studentResults.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSelectedStudent(s);
                              setStudentResults([]);
                              setStudentQuery('');
                            }}
                            className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                          >
                            <span className="font-medium text-foreground">{s.fullName}</span>
                            <span className="text-xs text-muted-foreground">
                              {s.email} · {s.id}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="space-y-2">
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className={inputCls} />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className={inputCls} />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (e.g. 0712345678)" className={inputCls} />
              </div>
            )}
          </div>

          {/* Course */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Course</label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputCls}>
              <option value="">Select a course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {formatCurrency(c.price, c.currency)}
                </option>
              ))}
            </select>
          </div>

          {/* Cohort (optional) */}
          {courseId && cohorts.length > 0 && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cohort <span className="normal-case text-muted-foreground/70">(optional)</span>
              </label>
              <select value={cohortId} onChange={(e) => setCohortId(e.target.value)} className={inputCls}>
                <option value="">No specific cohort</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id} disabled={c._count.enrollments >= c.maxSlots}>
                    {c.name} ({c._count.enrollments}/{c.maxSlots} slots)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount + plan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Total amount (KES)
              </label>
              <input
                type="number"
                min={0}
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputCls}
              />
              {totalAmount === 0 && <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Free enrollment — no payment needed.</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment plan</label>
              <select value={paymentPlan} onChange={(e) => setPaymentPlan(e.target.value)} className={inputCls}>
                <option value="upfront">Upfront</option>
                <option value="2-installments">2 installments</option>
                <option value="3-installments">3 installments</option>
              </select>
            </div>
          </div>

          {/* Payment status */}
          {totalAmount !== 0 && (
            <label className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm">
              <input type="checkbox" checked={markAsPaid} onChange={(e) => setMarkAsPaid(e.target.checked)} className="h-4 w-4 accent-primary" />
              <span>
                <span className="font-medium text-foreground">Mark as paid now</span>
                <span className="block text-xs text-muted-foreground">
                  Payment already collected (cash, bank transfer, etc.). Leave unchecked to send an invoice link instead.
                </span>
              </span>
            </label>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {submitting ? 'Enrolling…' : 'Create Enrollment'}
          </button>
        </div>
      </div>
    </div>
  );
}
