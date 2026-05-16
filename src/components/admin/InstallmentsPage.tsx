'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Bell } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { DataTable, type Column } from './DataTable';
import { StatusBadge } from './StatusBadge';
import { formatCurrency } from '@/lib/utils';

interface InstallmentItem {
  id: string;
  enrollmentId: string;
  installmentNo: number;
  amount: number;
  currency: string;
  dueDate: string;
  paidAt: string | null;
  paymentRef: string | null;
  status: string;
  reminderSentAt: string | null;
  enrollment: {
    id: string;
    fullName: string;
    email: string;
    courseName: string;
    studentUserId: string | null;
  };
}

interface PageData { total: number; page: number; pages: number; items: InstallmentItem[] }

const STATUS_OPTIONS = ['', 'pending', 'reminded', 'paid', 'overdue'];
const DAYS_OPTIONS = [7, 14, 30, 60, 90];

export function InstallmentsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [daysAhead, setDaysAhead] = useState(30);
  const [sending, setSending] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      daysAhead: String(daysAhead),
      ...(status ? { status } : {}),
    });
    const res = await fetch(`/api/admin/installments?${params}`);
    setData(await res.json());
    setLoading(false);
  }, [page, status, daysAhead]);

  useEffect(() => { load(); }, [load]);

  async function sendReminder(installmentId: string) {
    setSending(installmentId);
    await fetch('/api/admin/installments?action=send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installmentId }),
    });
    setSending(null);
    load();
  }

  function daysUntil(dateStr: string): number {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  const columns: Column<InstallmentItem>[] = [
    {
      key: 'enrollment',
      header: 'Student',
      render: (row) => (
        <div>
          <p className="font-medium text-sm text-foreground">{row.enrollment.fullName}</p>
          <p className="text-xs text-muted-foreground">{row.enrollment.email}</p>
          {row.enrollment.studentUserId && (
            <p className="text-xs font-mono text-primary">{row.enrollment.studentUserId}</p>
          )}
        </div>
      ),
    },
    {
      key: 'courseName',
      header: 'Course',
      render: (row) => <span className="text-xs text-muted-foreground">{row.enrollment.courseName}</span>,
    },
    {
      key: 'installmentNo',
      header: 'Installment',
      render: (row) => (
        <span className="text-xs font-semibold text-foreground">#{row.installmentNo}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => (
        <span className="text-xs font-semibold text-foreground">
          {formatCurrency(row.amount, row.currency)}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (row) => {
        const days = daysUntil(row.dueDate);
        const isOverdue = days < 0;
        const isSoon = days >= 0 && days <= 7;
        return (
          <div>
            <p className={`text-xs font-medium ${isOverdue ? 'text-destructive' : isSoon ? 'text-amber-600' : 'text-foreground'}`}>
              {new Date(row.dueDate).toLocaleDateString('en-GB')}
            </p>
            <p className={`text-[11px] ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
              {isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `in ${days}d`}
            </p>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'reminderSentAt',
      header: 'Last Reminder',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.reminderSentAt ? new Date(row.reminderSentAt).toLocaleDateString('en-GB') : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => row.status !== 'paid' ? (
        <button
          onClick={() => sendReminder(row.id)}
          disabled={sending === row.id}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-50 transition-colors"
        >
          <Bell className="h-3 w-3" />
          {sending === row.id ? 'Sending…' : 'Remind'}
        </button>
      ) : null,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <AdminPageHeader
        title="Installment Schedules"
        description={`${data?.total ?? 0} upcoming / overdue payments`}
        actions={
          <button onClick={load} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        }
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
        <select
          value={daysAhead}
          onChange={(e) => { setDaysAhead(Number(e.target.value)); setPage(1); }}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        >
          {DAYS_OPTIONS.map((d) => <option key={d} value={d}>Due within {d} days</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        keyField="id"
        total={data?.total}
        page={data?.page}
        pages={data?.pages}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No upcoming installments."
      />
    </div>
  );
}
