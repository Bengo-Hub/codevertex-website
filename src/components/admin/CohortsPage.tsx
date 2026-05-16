'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { StatusBadge } from './StatusBadge';

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
}

const STATUS_OPTIONS = ['open', 'full', 'closed', 'completed'];

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
    if (!form.courseId || !form.name || !form.startDate) return;
    setSaving(true);

    const body = {
      courseId: form.courseId,
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      maxSlots: form.maxSlots,
      status: form.status,
    };

    if (editId) {
      await fetch(`/api/admin/cohorts/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setEditId(null);
    } else {
      await fetch('/api/admin/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setShowForm(false);
    }

    setForm(blankForm);
    setSaving(false);
    load();
  }

  async function deleteCohort(id: string, enrollmentCount: number) {
    if (enrollmentCount > 0) {
      alert(`Cannot delete cohort with ${enrollmentCount} enrollment${enrollmentCount !== 1 ? 's' : ''}. Close it instead.`);
      return;
    }
    if (!confirm('Delete this cohort?')) return;
    await fetch(`/api/admin/cohorts/${id}`, { method: 'DELETE' });
    load();
  }

  const formFields = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="col-span-2 sm:col-span-1">
        <label className="block text-xs font-medium text-muted-foreground mb-1">Course *</label>
        <select
          value={form.courseId}
          onChange={(e) => setForm({ ...form, courseId: e.target.value })}
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
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">End Date</label>
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

  return (
    <div className="max-w-6xl mx-auto">
      <AdminPageHeader
        title="Cohorts"
        description={`${cohorts.length} cohort${cohorts.length !== 1 ? 's' : ''}`}
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

      <div className="flex items-center gap-3 mb-5">
        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        >
          <option value="">All courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading…</div>
      ) : cohorts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No cohorts found.</div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Cohort', 'Course', 'Start Date', 'End Date', 'Slots', 'Enrollments', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cohorts.map((cohort) => (
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
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(cohort.startDate).toLocaleDateString('en-GB')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
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
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteCohort(cohort.id, cohort._count.enrollments)}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
