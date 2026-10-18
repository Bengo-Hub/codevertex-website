'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authedFetch } from '@/lib/auth/authed-fetch';
import { formatCurrency } from '@/lib/utils';
import { contactProblem, guardianProblem, isPlaceholderEmail, isUnder18 } from '@/lib/learner-rules';
import { StatusBadge } from './StatusBadge';
import { AdminModal, fieldCls, ghostBtn, labelCls, primaryBtn } from './AdminModal';

interface StudentDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dob: string | null;
  ssoUserId: string | null;
  guardianName: string | null;
  guardianEmail: string | null;
  guardianPhone: string | null;
  enrollments?: { id: string; courseName: string; paymentStatus: string; amount: number; totalAmount: number | null; currency: string; createdAt: string }[];
  certificates?: { id: string; certificateNumber: string; courseName: string; revoked: boolean }[];
}

/** Register a student (no studentId) or edit one, with their enrollments and certificates alongside. */
export function StudentFormModal({
  studentId,
  onClose,
  onSaved,
}: {
  studentId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(!!studentId);
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) return;
    authedFetch(`/api/admin/students/${encodeURIComponent(studentId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((s: StudentDetail | null) => {
        if (!s) {
          setError('Could not load this student.');
          return;
        }
        setDetail(s);
        setFullName(s.fullName);
        setEmail(isPlaceholderEmail(s.email) ? '' : s.email);
        setPhone(s.phone ?? '');
        setDob(s.dob ? s.dob.slice(0, 10) : '');
        setGuardianName(s.guardianName ?? '');
        setGuardianEmail(s.guardianEmail ?? '');
        setGuardianPhone(s.guardianPhone ?? '');
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  const minor = isUnder18(dob);
  const issue = !fullName.trim()
    ? 'Enter the name.'
    : contactProblem(minor, email, phone) || guardianProblem(email, minor, { name: guardianName, email: guardianEmail });
  // The account is tied to the email, so it is fixed once the student has signed up.
  const emailLocked = !!detail?.ssoUserId;

  async function save() {
    if (issue) {
      setError(issue);
      return;
    }
    setSaving(true);
    setError('');
    const body = {
      fullName: fullName.trim(),
      ...(emailLocked ? {} : { email: email.trim() }),
      phone: phone.trim(),
      dob,
      guardianName: guardianName.trim(),
      guardianEmail: guardianEmail.trim(),
      guardianPhone: guardianPhone.trim(),
    };
    try {
      const res = await authedFetch(studentId ? `/api/admin/students/${encodeURIComponent(studentId)}` : '/api/admin/students', {
        method: studentId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof result?.error === 'string' ? result.error : 'Could not save the student.');
        return;
      }
      toast.success(studentId ? 'Student updated' : `Student registered: ${result.id}`);
      onSaved();
      onClose();
    } catch {
      setError('Something went wrong. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminModal
      wide
      title={studentId ? `Edit ${detail?.fullName ?? 'student'}` : 'Register a student'}
      onClose={onClose}
      footer={
        <>
          <button className={ghostBtn} onClick={onClose}>Cancel</button>
          <button className={primaryBtn} onClick={save} disabled={saving || loading}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {studentId ? 'Save changes' : 'Register student'}
          </button>
        </>
      }
    >
      {loading ? (
        <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-4">
            {studentId && <p className="font-mono text-xs font-semibold text-primary">{studentId}</p>}
            <label className="block">
              <span className={labelCls}>Full name</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={fieldCls} />
            </label>
            <label className="block">
              <span className={labelCls}>Date of birth</span>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={fieldCls} />
            </label>
            <label className="block">
              <span className={labelCls}>Email {minor && <span className="font-normal normal-case">(optional for under 18)</span>}</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={emailLocked} className={fieldCls} />
              {emailLocked && <span className="mt-1 block text-xs text-muted-foreground">Fixed: this student already has a sign-in account.</span>}
            </label>
            <label className="block">
              <span className={labelCls}>Phone {minor && <span className="font-normal normal-case">(optional for under 18)</span>}</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254712345678" className={fieldCls} />
            </label>
          </div>

          <div className="space-y-4">
            <div className="space-y-3 rounded-xl border border-border p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Parent or guardian{minor ? '' : ' (optional)'}</p>
                <p className="text-xs text-muted-foreground">Required for learners under 18. They get a parent account to follow payments and progress.</p>
              </div>
              <input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Full name" className={fieldCls} />
              <input type="email" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} placeholder="Email" className={fieldCls} />
              <input value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} placeholder="Phone (optional)" className={fieldCls} />
            </div>

            {detail && (
              <div className="space-y-2 rounded-xl border border-border p-4">
                <p className="text-sm font-semibold text-foreground">Courses</p>
                {(detail.enrollments ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Not enrolled in any course yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {detail.enrollments!.map((e) => (
                      <li key={e.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-foreground">{e.courseName}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-muted-foreground">{formatCurrency(e.amount, e.currency)}</span>
                          <StatusBadge status={e.paymentStatus} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {(detail.certificates ?? []).length > 0 && (
                  <p className="pt-1 text-xs text-muted-foreground">
                    {detail.certificates!.filter((c) => !c.revoked).length} certificate(s) issued.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </AdminModal>
  );
}
