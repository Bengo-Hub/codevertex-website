'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { DataTable, type Column } from './DataTable';
import { StatusBadge } from './StatusBadge';
import { formatCurrency } from '@/lib/utils';

interface Enrollment {
  id: string;
  studentUserId: string | null;
  fullName: string;
  email: string;
  phone: string;
  courseName: string;
  category: string;
  paymentPlan: string | null;
  amount: number;
  totalAmount: number | null;
  currency: string;
  paymentStatus: string;
  createdAt: string;
  installments: { installmentNo: number; amount: number; status: string }[];
}

interface Response {
  total: number;
  page: number;
  pages: number;
  items: Enrollment[];
}

const STATUS_OPTIONS = ['', 'pending', 'succeeded', 'failed', 'refunded'];

export function EnrollmentsPage() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
    });
    const res = await fetch(`/api/admin/enrollments?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, newStatus: string) {
    await fetch(`/api/admin/enrollments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: newStatus }),
    });
    load();
  }

  const columns: Column<Enrollment>[] = [
    {
      key: 'studentUserId',
      header: 'Student ID',
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">{row.studentUserId ?? '—'}</span>
      ),
    },
    {
      key: 'fullName',
      header: 'Student',
      render: (row) => (
        <div>
          <p className="font-medium text-foreground text-xs">{row.fullName}</p>
          <p className="text-[11px] text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'courseName',
      header: 'Course',
      render: (row) => (
        <div>
          <p className="text-xs font-medium text-foreground">{row.courseName}</p>
          <p className="text-[11px] text-muted-foreground">{row.category}</p>
        </div>
      ),
    },
    {
      key: 'paymentPlan',
      header: 'Plan',
      render: (row) => (
        <span className="text-xs text-muted-foreground capitalize">
          {row.paymentPlan?.replace(/-/g, ' ') ?? 'upfront'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Paid Now / Total',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-foreground">{formatCurrency(row.amount, row.currency)}</p>
          {row.totalAmount && row.totalAmount !== row.amount && (
            <p className="text-[11px] text-muted-foreground">of {formatCurrency(row.totalAmount, row.currency)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      render: (row) => <StatusBadge status={row.paymentStatus} />,
    },
    {
      key: 'createdAt',
      header: 'Enrolled',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString('en-GB')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <select
          value={row.paymentStatus}
          onChange={(e) => updateStatus(row.id, e.target.value)}
          className="text-xs rounded border border-border bg-background px-2 py-1 text-foreground"
        >
          {['pending', 'succeeded', 'failed', 'refunded'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <AdminPageHeader
        title="Enrollments"
        description={`${data?.total ?? 0} total enrollments`}
        actions={
          <button onClick={load} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, course…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s ? s : 'All statuses'}</option>
          ))}
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
        emptyMessage="No enrollments yet."
      />
    </div>
  );
}
