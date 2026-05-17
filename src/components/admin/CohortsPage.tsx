'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { StatusBadge } from './StatusBadge';
import { toast } from 'sonner';

interface Cohort {
  id: string;
  courseId: string;
  name: string;
  startDate: string;
  endDate: string | null;
  maxSlots: number;
  status: string;
  createdAt: string;
  _count: { enrollments: number };
}

interface Course {
  id: string;
  name: string;
  categoryId: string;
  duration: string;
}

function parseDurationWeeks(duration: string): number | null {
  const m = duration.match(/(\d+)\s*week/i);
  if (m) return parseInt(m[1], 10);
  const mo = duration.match(/(\d+)\s*month/i);
  if (mo) return parseInt(mo[1], 10) * 4;
  return null;
}

function calcEndDate(startDate: string, duration: string): string {
  const weeks = parseDurationWeeks(duration);
  if (!weeks || !startDate) return '';
  const d = new Date(startDate);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split('T')[0];
}

const STATUS_OPTIONS = ['open', 'full', 'closed', 'completed'];
const PAGE_SIZE = 15;

const blankForm = { courseId: '', name: '', startDate: '', endDate: '', maxSlots: 20, status: 'open' };

export function CohortsPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams(filterCourse ? { courseId: filterCourse } : {});
    const [cohortsRes, coursesRes] = await Promise.all([
      fetch(`/api/admin/cohorts?${params}`),
      fetch('/api/admin/courses?includeInactive=true'),
    ]);
    const [cohortsData, coursesData] = await Promise.all([cohortsRes.json(), coursesRes.json()]);
    setCohorts(cohortsData);
    setCourses(coursesData);
    setLoading(false);
  }, [filterCourse]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filterCourse, filterStatus]);

  function startEdit(cohort: Cohort) {
    setEditId(cohort.id);
    setForm({
      courseId: cohort.courseId,
      name: cohort.name,
      startDate: cohort.startDate.split('T')[0],
      endDate: cohort.endDate ? cohort.endDate.split('T')[0] : '',
      maxSlots: cohort.maxSlots,
      status: cohort.status,
    });
    setShowForm(false);
  }

  function cancelEdit() {
    setEditId(null);
    setForm(blankForm);
  }

  async function submit() {
    if (!form.courseId || !form.name || !form.startDate) {
      toast.error('Course, name and start date are required');
      return;
    }
    setSaving(true);

    const body = {
      courseId: form.courseId,
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      maxSlots: form.maxSlots,
      status: form.status,
    };

    const res = editId
      ? await fetch(`/api/admin/cohorts/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      : await fetch('/api/admin/cohorts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

    if (res.ok) {
      toast.success(editId ? 'Cohort updated' : 'Cohort created');
      setEditId(null);
      setShowForm(false);
    } else {
      toast.error(editId ? 'Failed to update cohort' : 'Failed to create cohort');
    }

    setForm(blankForm);
    setSaving(false);
    load();
  }

  async function deleteCohort(id: string, enrollmentCount: number) {
    if (enrollmentCount > 0) {
      toast.error(
        `Cannot delete — ${enrollmentCount} enrollment${enrollmentCount !== 1 ? 's' : ''} exist. Close it instead.`
      );
      return;
    }
    toast('Delete this cohort?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          const res = await fetch(`/api/admin/cohorts/${id}`, { method: 'DELETE' });
          if (res.ok) {
            toast.success('Cohort deleted');
            load();
          } else {
            toast.error('Delete failed');
          }
        },
      },
      cancel: { label: 'Cancel', onClick: () => {} },
    });
  }

  const formFields = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="col-span-2 sm:col-span-1">
        <label className="block text-xs font-medium text-muted-foreground mb-1">Course *</label>
        <select
          value={form.courseId}
          onChange={(e) => {
            const course = courses.find(c => c.id === e.target.value);
            const endDate = (course && form.startDate) ? calcEndDate(form.startDate, course.duration) : form.endDate;
            setForm({ ...form, courseId: e.target.value, endDate });
          }}
          className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        >
          <option value="">Select course</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="col-span-2 sm:col-span-2">
        <label className="block text-xs font-medium text-muted-foreground mb-1">Cohort Name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. May 2026 Cohort"
          className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Start Date *</label>
        <input
          type="date"
          value={form.startDate}
          onChange={(e) => {
            const course = courses.find(c => c.id === form.courseId);
            const endDate = (course && e.target.value) ? calcEndDate(e.target.value, course.duration) : form.endDate;
            setForm({ ...form, startDate: e.target.value, endDate });
          }}
          className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          End Date
          {form.courseId && form.startDate && (() => {
            const c = courses.find(x => x.id === form.courseId);
            return c ? <span className="ml-1 text-[10px] text-primary">(auto from {c.duration})</span> : null;
          })()}
        </label>
        <input
          type="date"
          value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Max Slots</label>
        <input
          type="number"
          value={form.maxSlots}
          onChange={(e) => setForm({ ...form, maxSlots: Number(e.target.value) })}
          className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );

  // Client-side status filter + pagination
  const filtered = filterStatus
    ? cohorts.filter((c) => c.status === filterStatus)
    : cohorts;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-6xl mx-auto">
      <AdminPageHeader
        title="Cohorts"
        description={`${filtered.length} cohort${filtered.length !== 1 ? 's' : ''}`}
        actions={
          <button
            onClick={() => { setShowForm(!showForm); setEditId(null); setForm(blankForm); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Cohort
          </button>
        }
      />

      {showForm && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Create New Cohort</h3>
          {formFields}
          <div className="flex gap-2 mt-4">
            <button
              onClick={submit}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creating…' : 'Create Cohort'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        >
          <option value="">All courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No cohorts found.</div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {['Cohort', 'Course', 'Start Date', 'End Date', 'Slots', 'Enrolled', 'Status', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginated.map((cohort) =>
                    editId === cohort.id ? (
                      <tr key={cohort.id} className="bg-muted/20">
                        <td colSpan={8} className="px-4 py-4">
                          {formFields}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={submit}
                              disabled={saving}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                            >
                              <Check className="h-3 w-3" />
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted"
                            >
                              <X className="h-3 w-3" />
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={cohort.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm text-foreground">{cohort.name}</p>
                          <p className="text-xs font-mono text-muted-foreground">{cohort.id}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">
                            {courses.find((c) => c.id === cohort.courseId)?.name ?? cohort.courseId}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs text-muted-foreground">
                            {new Date(cohort.startDate).toLocaleDateString('en-GB')}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs text-muted-foreground">
                            {cohort.endDate ? new Date(cohort.endDate).toLocaleDateString('en-GB') : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">{cohort.maxSlots}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${cohort._count.enrollments >= cohort.maxSlots ? 'text-destructive' : 'text-foreground'}`}>
                            {cohort._count.enrollments} / {cohort.maxSlots}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={cohort.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(cohort)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteCohort(cohort.id, cohort._count.enrollments)}
                              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-8 h-8 rounded-lg text-xs font-medium transition-colors border ${
                      page === p
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-muted text-foreground'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
