'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { authedFetch } from '@/lib/auth/authed-fetch';
import { formatCurrency } from '@/lib/utils';
import { displayEmail } from '@/lib/learner-rules';
import { StatusBadge } from './StatusBadge';
import { AdminModal, ghostBtn } from './AdminModal';

interface Detail {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  courseName: string;
  category: string;
  paymentPlan: string | null;
  paymentRef: string | null;
  paymentStatus: string;
  amount: number;
  totalAmount: number | null;
  currency: string;
  createdAt: string;
  discountCode: string | null;
  studentUserId: string | null;
  studentUser: { guardianName: string | null; guardianEmail: string | null; guardianPhone: string | null } | null;
  cohort: { name: string } | null;
  installments: { id: string; installmentNo: number; amount: number; status: string; dueDate: string; paidAt: string | null; paymentRef: string | null }[];
}

const date = (d: string) => new Date(d).toLocaleDateString('en-GB');

/** One enrollment in full: the learner, their guardian, the plan and every installment. */
export function EnrollmentDetailModal({
  enrollmentId,
  onClose,
  onEditStudent,
}: {
  enrollmentId: string;
  onClose: () => void;
  onEditStudent: (studentId: string) => void;
}) {
  const [d, setD] = useState<Detail | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    authedFetch(`/api/admin/enrollments/${enrollmentId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setD)
      .catch(() => setFailed(true));
  }, [enrollmentId]);

  return (
    <AdminModal
      wide
      title={d ? `${d.fullName}: ${d.courseName}` : 'Enrollment'}
      onClose={onClose}
      footer={
        <>
          {d?.studentUserId && (
            <button className={ghostBtn} onClick={() => onEditStudent(d.studentUserId!)}>Edit student</button>
          )}
          <button className={ghostBtn} onClick={onClose}>Close</button>
        </>
      }
    >
      {failed ? (
        <p className="text-sm text-destructive">Could not load this enrollment.</p>
      ) : !d ? (
        <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <Row k="Student ID" v={d.studentUserId ?? 'None'} />
            <Row k="Email" v={displayEmail(d.email)} />
            <Row k="Phone" v={d.phone || 'None'} />
            {d.studentUser?.guardianEmail && (
              <Row k="Guardian" v={`${d.studentUser.guardianName ?? ''} (${d.studentUser.guardianEmail}${d.studentUser.guardianPhone ? `, ${d.studentUser.guardianPhone}` : ''})`} />
            )}
            <Row k="Category" v={d.category} />
            <Row k="Cohort" v={d.cohort?.name ?? 'No specific cohort'} />
            <Row k="Enrolled" v={date(d.createdAt)} />
          </div>
          <div className="space-y-2 text-sm">
            <Row k="Status" v={<StatusBadge status={d.paymentStatus} />} />
            <Row k="Plan" v={d.paymentPlan?.replace(/-/g, ' ') ?? 'upfront'} />
            <Row k="Total" v={formatCurrency(d.totalAmount ?? d.amount, d.currency)} />
            <Row k="First payment" v={formatCurrency(d.amount, d.currency)} />
            {d.discountCode && <Row k="Discount code" v={d.discountCode} />}
            {d.paymentRef && <Row k="Payment reference" v={d.paymentRef} />}
          </div>
          <div className="md:col-span-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment schedule</p>
            {d.installments.length === 0 ? (
              <p className="text-xs text-muted-foreground">Paid in one payment: no installments.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                {d.installments.map((i) => (
                  <div key={i.id} className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 text-xs last:border-0">
                    <span className="text-foreground">Payment {i.installmentNo}</span>
                    <span className="text-muted-foreground">due {date(i.dueDate)}{i.paidAt ? `, paid ${date(i.paidAt)}` : ''}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{formatCurrency(i.amount, d.currency)}</span>
                      <StatusBadge status={i.status} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminModal>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium text-foreground">{v}</span>
    </div>
  );
}
