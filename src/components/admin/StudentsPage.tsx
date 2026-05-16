'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { DataTable, type Column } from './DataTable';
import Link from 'next/link';

interface Student {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dob: string | null;
  createdAt: string;
  _count: { enrollments: number };
}

interface PageData { total: number; page: number; pages: number; items: Student[] }

export function StudentsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), ...(search ? { search } : {}) });
    const res = await fetch(`/api/admin/students?${params}`);
    setData(await res.json());
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const columns: Column<Student>[] = [
    {
      key: 'id',
      header: 'Student ID',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-primary whitespace-nowrap">{row.id}</span>
      ),
    },
    {
      key: 'fullName',
      header: 'Name',
      render: (row) => (
        <div className="min-w-32">
          <p className="font-medium text-sm text-foreground">{row.fullName}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => <span className="text-xs text-muted-foreground whitespace-nowrap">{row.phone}</span>,
    },
    {
      key: '_count',
      header: 'Enrollments',
      render: (row) => (
        <Link
          href={`/admin/enrollments?search=${encodeURIComponent(row.email)}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline whitespace-nowrap"
        >
          {row._count.enrollments} course{row._count.enrollments !== 1 ? 's' : ''}
        </Link>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(row.createdAt).toLocaleDateString('en-GB')}
        </span>
      ),
    },
  ];

  return (
    <div className="w-full">
      <AdminPageHeader
        title="Students"
        description={`${data?.total ?? 0} registered students`}
        actions={
          <button onClick={load} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        }
      />

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by ID, name, email, phone…"
          className="w-full sm:max-w-sm pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
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
        emptyMessage="No students yet."
      />
    </div>
  );
}
