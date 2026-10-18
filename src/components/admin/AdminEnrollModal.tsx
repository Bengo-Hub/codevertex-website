'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Search, Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { authedFetch } from '@/lib/auth/authed-fetch';
import { CUSTOM_PLAN_KEY, coursePolicy, customLimits, planKey } from '@/lib/installments';
import {
  ACTIVE_ENROLLMENT_STATUSES,
  ageOn,
  ageProblem,
  getAgeRange,
  guardianProblem,
} from '@/lib/learner-rules';
import { COUNTRY_CODES, isValidLocalPhone, toInternationalPhone } from '@/lib/phone-countries';
import type { InstallmentPlan } from '@/types/course';

// How an already-collected payment was made; booked in treasury with its reference.
const PAID_METHODS = [
  { value: 'bank_transfer', label: 'Bank deposit or transfer' },
  { value: 'mpesa', label: 'M-Pesa (paid to the till directly)' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
] as const;

const EXPERIENCE_LEVELS = ['Complete Beginner', 'Some Basic Knowledge', 'Intermediate', 'Advanced, looking to specialise'];
const HEARD_FROM = ['Social Media', 'WhatsApp', 'Referral', 'Google Search', 'Partner Institution', 'Other'];

interface CourseOption {
  id: string;
  name: string;
  price: number;
  currency: string;
  audience: string | null;
  installmentsEnabled: boolean;
  installmentPlans: InstallmentPlan[] | null;
  metadata?: unknown;
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
  dob: string | null;
  guardianName: string | null;
  guardianEmail: string | null;
  guardianPhone: string | null;
  enrollments?: { courseId: string; courseName: string; paymentStatus: string }[];
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

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
  // A student already on record under the email typed for a "new" one.
  const [emailMatch, setEmailMatch] = useState<StudentOption | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [experience, setExperience] = useState('');
  const [howHeard, setHowHeard] = useState('');

  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [paymentPlan, setPaymentPlan] = useState('upfront');
  const [customDeposit, setCustomDeposit] = useState<number | ''>('');
  const [customCount, setCustomCount] = useState(2);
  const [markAsPaid, setMarkAsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAID_METHODS)[number]['value']>('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedCourse = useMemo(() => courses.find((c) => c.id === courseId) ?? null, [courses, courseId]);
  // The course's own plans, the same ones checkout offers, plus a custom plan when allowed.
  const coursePlans = selectedCourse?.installmentsEnabled ? (selectedCourse.installmentPlans ?? []) : [];
  const policy = selectedCourse?.installmentsEnabled ? coursePolicy(selectedCourse.metadata) : null;
  const limits = policy && typeof totalAmount === 'number' && totalAmount > 0 ? customLimits(policy, totalAmount) : null;
  const planOptions = [
    ...(coursePlans.some((p) => planKey(p.label) === 'upfront') ? [] : [{ key: 'upfront', label: 'Upfront' }]),
    ...coursePlans.map((p) => ({ key: planKey(p.label), label: p.label })),
    ...(limits && limits.counts.length > 0 ? [{ key: CUSTOM_PLAN_KEY, label: 'Custom deposit and split' }] : []),
  ];

  // The learner's details come from the chosen student, or from what is typed for a new one.
  const learnerDob = selectedStudent ? (selectedStudent.dob?.slice(0, 10) ?? dob) : dob;
  const learnerEmail = selectedStudent?.email ?? email;
  const learnerAge = ageOn(learnerDob);
  const isMinor = learnerAge !== null && learnerAge < 18;
  const ageRange = getAgeRange(selectedCourse?.audience);
  // Ask for a date of birth whenever it is unknown, so age rules and guardians can be applied.
  const needsDob = !selectedStudent || !selectedStudent.dob;
  const ageIssue = selectedCourse && learnerDob ? ageProblem(learnerDob, selectedCourse.audience) : '';
  const guardianIssue = guardianProblem(learnerEmail, isMinor, {
    name: guardianName,
    email: guardianEmail,
  });
  const phoneBad = mode === 'new' && phone.trim() !== '' && !isValidLocalPhone(countryCode, phone);

  // Courses the chosen student is already confirmed in cannot be picked again.
  const enrolledCourseIds = useMemo(
    () =>
      new Set(
        (selectedStudent?.enrollments ?? [])
          .filter((e) => ACTIVE_ENROLLMENT_STATUSES.includes(e.paymentStatus))
          .map((e) => e.courseId),
      ),
    [selectedStudent],
  );

  // Load course list once.
  useEffect(() => {
    authedFetch('/api/admin/courses')
      .then((r) => r.json())
      .then((list: CourseOption[]) => setCourses(Array.isArray(list) ? list : []))
      .catch(() => setCourses([]));
  }, []);

  // Prefill amount whenever the course changes.
  useEffect(() => {
    if (selectedCourse) setTotalAmount(selectedCourse.price);
    setPaymentPlan('upfront');
    setCohortId('');
    setCohorts([]);
  }, [selectedCourse]);

  // Load cohorts for the selected course.
  useEffect(() => {
    if (!courseId) return;
    authedFetch(`/api/admin/cohorts?courseId=${encodeURIComponent(courseId)}`)
      .then((r) => r.json())
      .then((list: CohortOption[]) => setCohorts(Array.isArray(list) ? list.filter((c) => c.status === 'open') : []))
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
      authedFetch(`/api/admin/students?search=${encodeURIComponent(studentQuery)}&limit=6`)
        .then((r) => r.json())
        .then((json) => setStudentResults(json.items ?? []))
        .catch(() => setStudentResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [studentQuery, mode]);

  // A "new" student whose email is already on record should be that student, not a second one.
  useEffect(() => {
    const typed = email.trim().toLowerCase();
    if (mode !== 'new' || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(typed)) {
      setEmailMatch(null);
      return;
    }
    const handle = setTimeout(() => {
      authedFetch(`/api/admin/students?search=${encodeURIComponent(typed)}&limit=5`)
        .then((r) => r.json())
        .then((json) => {
          const hit = (json.items ?? []).find((s: StudentOption) => s.email.toLowerCase() === typed);
          setEmailMatch(hit ?? null);
        })
        .catch(() => setEmailMatch(null));
    }, 400);
    return () => clearTimeout(handle);
  }, [email, mode]);

  // The student's guardian on record is the starting point; the admin can correct it.
  function chooseStudent(s: StudentOption) {
    setSelectedStudent(s);
    setMode('search');
    setStudentResults([]);
    setStudentQuery('');
    setEmailMatch(null);
    setDob('');
    setGuardianName(s.guardianName ?? '');
    setGuardianEmail(s.guardianEmail ?? '');
    setGuardianPhone(s.guardianPhone ?? '');
    if (courseId && ACTIVE_ENROLLMENT_STATUSES.includes(
      (s.enrollments ?? []).find((e) => e.courseId === courseId)?.paymentStatus ?? '')) {
      setCourseId('');
    }
  }

  function clearStudent() {
    setSelectedStudent(null);
    setGuardianName('');
    setGuardianEmail('');
    setGuardianPhone('');
    setDob('');
  }

  const courseTaken = !!courseId && enrolledCourseIds.has(courseId);
  const needsReference = markAsPaid && totalAmount !== 0;
  const learnerReady = selectedStudent
    ? true
    : mode === 'new' && !!fullName.trim() && !!email.trim() && !!phone.trim() && !phoneBad;
  // Like public checkout, a new student needs a date of birth; a known student only when the
  // course has an age limit and none is on record.
  const dobReady = selectedStudent ? !needsDob || !!dob || !ageRange : !!dob;
  const canSubmit =
    !!courseId &&
    !courseTaken &&
    totalAmount !== '' &&
    learnerReady &&
    dobReady &&
    !ageIssue &&
    !guardianIssue &&
    (!needsReference || paymentReference.trim().length >= 3);

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const guardianBody = isMinor
        ? {
            guardianName: guardianName.trim(),
            guardianEmail: guardianEmail.trim(),
            guardianPhone: guardianPhone.trim() || undefined,
          }
        : {};
      const res = await authedFetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(selectedStudent
            ? { studentId: selectedStudent.id, ...(needsDob && dob ? { dob } : {}) }
            : {
                fullName: fullName.trim(),
                email: email.trim(),
                phone: toInternationalPhone(countryCode, phone),
                ...(dob ? { dob } : {}),
              }),
          ...guardianBody,
          experience: experience || undefined,
          howHeard: howHeard || undefined,
          courseId,
          cohortId: cohortId || undefined,
          totalAmount: Number(totalAmount),
          paymentPlan,
          customPlan: paymentPlan === CUSTOM_PLAN_KEY ? { deposit: Number(customDeposit) || 0, count: customCount } : undefined,
          markAsPaid,
          ...(needsReference ? { paymentMethod, paymentReference: paymentReference.trim() } : {}),
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof result?.error === 'string' ? result.error : 'Could not create enrollment.');
        return;
      }
      toast.success(`Enrolled ${selectedStudent?.fullName ?? fullName}. Student ID ${result.studentId}`);
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
  const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground';
  const sectionCls = 'space-y-4 rounded-xl border border-border p-4';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">New Enrollment</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-6 lg:grid-cols-2">
          {/* Learner */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student</label>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'search' ? 'new' : 'search');
                  clearStudent();
                }}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {mode === 'search' ? 'New student instead' : 'Search existing instead'}
              </button>
            </div>

            {mode === 'search' ? (
              selectedStudent ? (
                <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{selectedStudent.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {selectedStudent.email} · {selectedStudent.id}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {selectedStudent.phone}
                        {selectedStudent.dob ? ` · born ${selectedStudent.dob.slice(0, 10)} (age ${ageOn(selectedStudent.dob.slice(0, 10))})` : ''}
                      </p>
                    </div>
                    <button type="button" onClick={clearStudent} className="shrink-0 text-xs font-medium text-muted-foreground hover:text-destructive">
                      Change
                    </button>
                  </div>
                  {(selectedStudent.enrollments ?? []).length > 0 && (
                    <div className="border-t border-primary/20 pt-2">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Enrolled courses</p>
                      <ul className="space-y-0.5">
                        {(selectedStudent.enrollments ?? []).slice(0, 6).map((e, i) => (
                          <li key={`${e.courseId}-${i}`} className="flex justify-between gap-2 text-xs">
                            <span className="truncate text-foreground">{e.courseName}</span>
                            <span className={ACTIVE_ENROLLMENT_STATUSES.includes(e.paymentStatus) ? 'font-medium text-emerald-600' : 'text-muted-foreground'}>
                              {ACTIVE_ENROLLMENT_STATUSES.includes(e.paymentStatus) ? 'confirmed' : e.paymentStatus}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    placeholder="Search by name, email, phone or student ID"
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
                            onClick={() => chooseStudent(s)}
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
              <div className="space-y-3">
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className={inputCls} />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className={inputCls} />
                {emailMatch && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
                    <span className="text-foreground">
                      {emailMatch.fullName} ({emailMatch.id}) already uses this email.
                    </span>
                    <button type="button" onClick={() => chooseStudent(emailMatch)} className="shrink-0 font-semibold text-primary hover:underline">
                      Use this student
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <select
                    value={countryCode.code}
                    onChange={(e) => setCountryCode(COUNTRY_CODES.find((c) => c.code === e.target.value) ?? COUNTRY_CODES[0])}
                    aria-label="Country code"
                    className="shrink-0 rounded-lg border border-border bg-background px-2 py-2 text-xs text-foreground focus:outline-none"
                  >
                    {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={countryCode.code === '+254' ? '0712 345 678' : 'Phone number'}
                    className={inputCls}
                  />
                </div>
                {phoneBad && <p className="text-xs text-destructive">Invalid phone number for {countryCode.country}.</p>}
              </div>
            )}

            {(mode === 'new' || (selectedStudent && needsDob)) && (
              <div>
                <label className={labelCls}>
                  Date of birth
                  {ageRange && <span className="ml-1 font-normal normal-case">(course ages {ageRange.min}-{ageRange.max})</span>}
                </label>
                <input type="date" max={today()} value={dob} onChange={(e) => setDob(e.target.value)} className={inputCls} />
              </div>
            )}
            {ageIssue && <p className="text-xs text-destructive">{ageIssue}</p>}
            {!ageIssue && !dobReady && selectedStudent && selectedCourse && (
              <p className="text-xs text-destructive">{ageProblem(undefined, selectedCourse.audience)}</p>
            )}

            {isMinor && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Parent or guardian</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Learners under 18 enrol with a parent or guardian. They get their own parent account to follow payments and progress.
                  </p>
                </div>
                <input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Full name" className={inputCls} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} placeholder="Email" type="email" className={inputCls} />
                  <input value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} placeholder="Phone (optional)" type="tel" className={inputCls} />
                </div>
                {guardianIssue && (guardianName || guardianEmail) && <p className="text-xs text-destructive">{guardianIssue}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={labelCls}>Experience level <span className="font-normal normal-case">(optional)</span></span>
                <select value={experience} onChange={(e) => setExperience(e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  {EXPERIENCE_LEVELS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </label>
              <label className="block">
                <span className={labelCls}>Heard about us <span className="font-normal normal-case">(optional)</span></span>
                <select value={howHeard} onChange={(e) => setHowHeard(e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  {HEARD_FROM.map((o) => <option key={o}>{o}</option>)}
                </select>
              </label>
            </div>
          </div>

          {/* Course and payment */}
          <div className="space-y-5">
            <div className={sectionCls}>
              <div>
                <label className={labelCls}>Course</label>
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputCls}>
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id} disabled={enrolledCourseIds.has(c.id)}>
                      {c.name} ({formatCurrency(c.price, c.currency)}){enrolledCourseIds.has(c.id) ? ' - already enrolled' : ''}
                    </option>
                  ))}
                </select>
                {selectedCourse?.audience && <p className="mt-1 text-xs text-muted-foreground">For: {selectedCourse.audience}</p>}
                {courseTaken && <p className="mt-1 text-xs text-destructive">This student is already confirmed in this course.</p>}
              </div>

              {courseId && cohorts.length > 0 && (
                <div>
                  <label className={labelCls}>
                    Cohort <span className="font-normal normal-case text-muted-foreground/70">(optional)</span>
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
            </div>

            <div className={sectionCls}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Total amount ({selectedCourse?.currency ?? 'KES'})</label>
                  <input
                    type="number"
                    min={0}
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className={inputCls}
                  />
                  {totalAmount === 0 && <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Free enrollment, no payment needed.</p>}
                </div>
                <div>
                  <label className={labelCls}>Payment plan</label>
                  <select value={paymentPlan} onChange={(e) => setPaymentPlan(e.target.value)} className={inputCls}>
                    {planOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {paymentPlan === CUSTOM_PLAN_KEY && limits && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Deposit</label>
                    <input
                      type="number"
                      min={limits.minDeposit}
                      max={limits.maxDeposit}
                      value={customDeposit}
                      onChange={(e) => setCustomDeposit(e.target.value === '' ? '' : Number(e.target.value))}
                      className={inputCls}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">{limits.minDeposit.toLocaleString()} to {limits.maxDeposit.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className={labelCls}>Payments in all</label>
                    <select value={customCount} onChange={(e) => setCustomCount(Number(e.target.value))} className={inputCls}>
                      {limits.counts.map((n) => <option key={n} value={n}>{n} (deposit + {n - 1})</option>)}
                    </select>
                  </div>
                </div>
              )}

              {totalAmount !== 0 && (
                <label className="flex items-start gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm">
                  <input type="checkbox" checked={markAsPaid} onChange={(e) => setMarkAsPaid(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
                  <span>
                    <span className="font-medium text-foreground">Payment already collected</span>
                    <span className="block text-xs text-muted-foreground">
                      Cash, a bank deposit and so on. It is booked in treasury. Leave unchecked and the student pays through their enrollment link.
                    </span>
                  </span>
                </label>
              )}
              {needsReference && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelCls}>Paid by</span>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)} className={inputCls}>
                      {PAID_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelCls}>Bank slip or reference</span>
                    <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="e.g. FT26287XK9" className={inputCls} required />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-border px-6 py-4">
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
