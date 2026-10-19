'use client';

import { displayEmail } from '@/lib/learner-rules';
import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, Plus, Pencil, GraduationCap, Trash2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StudentFormModal } from './StudentFormModal';
import { AdminEnrollModal } from './AdminEnrollModal';
import { ResendAccessDialog } from './ResendAccessDialog';
import { AdminPageHeader } from './AdminPageHeader';
import { DataTable, type Column } from './DataTable';
import Link from 'next/link';
import { authedFetch } from '@/lib/auth/authed-fetch';

interface Student {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dob: string | null;
  createdAt: string;
  ssoUserId?: string | null;
  guardianName?: string | null;
  guardianEmail?: string | null;
  guardianSsoUserId?: string | null;
  _count: { enrollments: number };
}

interface PageData { total: number; page: number; pages: number; items: Student[] }

export function StudentsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [enrolling, setEnrolling] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [resending, setResending] = useState<Student | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), ...(search ? { search } : {}) });
    const res = await authedFetch(`/api/admin/students?${params}`);
    setData(res.ok ? await res.json() : null);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  async function confirmDelete() {
    if (!deleting) return;
    const res = await authedFetch(`/api/admin/students/${encodeURIComponent(deleting.id)}`, { method: 'DELETE' });
    const body = await res.json().catch(() => ({}));
    if (res.ok) toast.success(`${deleting.fullName} deleted`);
    else toast.error(typeof body?.error === 'string' ? body.error : 'Could not delete the student');
    setDeleting(null);
    load();
  }

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
          <p className="text-xs text-muted-foreground">{displayEmail(row.email)}</p>
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
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => setEditing(row.id)} title="View or edit" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setEnrolling(row)} title="Enroll in a course" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <GraduationCap className="h-3.5 w-3.5" />
          </button>
          {(row.ssoUserId || row.guardianSsoUserId) && (
            <button onClick={() => setResending(row)} title="Resend portal access" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              <KeyRound className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => setDeleting(row)} title="Delete" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <AdminPageHeader
        title="Students"
        description={`${data?.total ?? 0} registered students`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing('new')}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add student
            </button>
          <button onClick={load} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
          </div>
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

      {editing && <StudentFormModal studentId={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSaved={load} />}
      {enrolling && <AdminEnrollModal initialStudentId={enrolling.id} onClose={() => setEnrolling(null)} onCreated={load} />}
      {resending && <ResendAccessDialog student={resending} onClose={() => setResending(null)} />}
      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.fullName ?? 'student'}?`}
        description="Only students with no enrollments can be deleted. This can't be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
