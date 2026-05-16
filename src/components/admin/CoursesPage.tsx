'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { RefreshCw, Pencil, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface Course {
  id: string;
  categoryId: string;
  name: string;
  shortName: string | null;
  slug: string;
  duration: string;
  mode: string;
  price: number;
  currency: string;
  description: string;
  level: string;
  featured: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface EditForm {
  name: string;
  shortName: string;
  duration: string;
  mode: string;
  level: string;
  description: string;
  price: string;
  sortOrder: string;
}

const PAGE_SIZE = 12;
const MODES = ['online', 'in-person', 'hybrid'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];

function EditModal({
  course,
  onSave,
  onClose,
}: {
  course: Course;
  onSave: (id: string, data: Partial<Course>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<EditForm>({
    name: course.name,
    shortName: course.shortName ?? '',
    duration: course.duration,
    mode: course.mode,
    level: course.level,
    description: course.description,
    price: String(course.price),
    sortOrder: String(course.sortOrder),
  });
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSave() {
    setSaving(true);
    await onSave(course.id, {
      name: form.name,
      shortName: form.shortName || null,
      duration: form.duration,
      mode: form.mode,
      level: form.level,
      description: form.description,
      price: Number(form.price),
      sortOrder: Number(form.sortOrder),
    });
    setSaving(false);
    onClose();
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-lg bg-card rounded-2xl border border-border shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Edit Course</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{course.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Course Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Short Name</label>
              <input
                value={form.shortName}
                onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                placeholder="e.g. Data Science"
                className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Duration</label>
              <input
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="e.g. 3 months"
                className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Mode</label>
              <select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
                className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none"
              >
                {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Level</label>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none"
              >
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Price ({course.currency})</label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  color = 'primary',
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  color?: 'primary' | 'green';
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`w-9 h-5 rounded-full transition-colors shrink-0 ${
        checked
          ? color === 'green' ? 'bg-green-500' : 'bg-primary'
          : 'bg-muted-foreground/30'
      } disabled:opacity-50`}
    >
      <span
        className={`block w-3.5 h-3.5 rounded-full bg-white shadow-sm mx-0.5 transition-transform ${
          checked ? 'translate-x-4' : ''
        }`}
      />
    </button>
  );
}

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ includeInactive: String(includeInactive) });
    const res = await fetch(`/api/admin/courses?${params}`);
    setCourses(await res.json());
    setLoading(false);
  }, [includeInactive]);

  useEffect(() => { load(); }, [load]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, categoryFilter, includeInactive]);

  async function saveEdit(id: string, data: Partial<Course>) {
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success('Course updated');
      load();
    } else {
      toast.error('Failed to save changes');
    }
  }

  async function toggleField(courseId: string, field: 'featured' | 'isActive', current: boolean) {
    setToggling(courseId);
    const res = await fetch(`/api/admin/courses/${courseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !current }),
    });
    if (res.ok) {
      const label = field === 'featured' ? 'Featured' : 'Active';
      toast.success(`${label} ${!current ? 'enabled' : 'disabled'}`);
      load();
    } else {
      toast.error('Update failed');
    }
    setToggling(null);
  }

  const categories = [...new Set(courses.map((c) => c.categoryId))].sort();

  // Filter
  const filtered = courses.filter((c) => {
    if (categoryFilter && c.categoryId !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || c.level.toLowerCase().includes(q);
    }
    return true;
  });

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Group paginated by category
  const paginatedCategories = [...new Set(paginated.map((c) => c.categoryId))].sort();

  return (
    <div className="max-w-7xl mx-auto">
      <AdminPageHeader
        title="Courses"
        description={`${filtered.length} course${filtered.length !== 1 ? 's' : ''}${search || categoryFilter ? ' (filtered)' : ''}`}
        actions={
          <button
            onClick={load}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded"
          />
          Show inactive
        </label>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No courses found.</div>
      ) : (
        <>
          <div className="space-y-8">
            {paginatedCategories.map((cat) => (
              <div key={cat}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  {cat}
                  <span className="font-normal normal-case tracking-normal">
                    ({paginated.filter((c) => c.categoryId === cat).length})
                  </span>
                </h3>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Level</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Mode</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Duration</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Price</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Featured</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Active</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Order</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {paginated.filter((c) => c.categoryId === cat).map((course) => (
                          <tr
                            key={course.id}
                            className={`hover:bg-muted/30 transition-colors ${!course.isActive ? 'opacity-50' : ''}`}
                          >
                            <td className="px-4 py-3 min-w-50">
                              <p className="font-medium text-sm text-foreground">{course.name}</p>
                              {course.shortName && (
                                <p className="text-xs text-muted-foreground">{course.shortName}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-xs capitalize text-muted-foreground">{course.level}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-xs capitalize text-muted-foreground">{course.mode}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-xs text-muted-foreground">{course.duration}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-xs font-semibold text-foreground">
                                {formatCurrency(course.price, course.currency)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Toggle
                                checked={course.featured}
                                onChange={() => toggleField(course.id, 'featured', course.featured)}
                                disabled={toggling === course.id}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Toggle
                                checked={course.isActive}
                                onChange={() => toggleField(course.id, 'isActive', course.isActive)}
                                color="green"
                                disabled={toggling === course.id}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-muted-foreground">{course.sortOrder}</span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setEditCourse(course)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
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
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-xs">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`min-w-8 h-8 rounded-lg text-xs font-medium transition-colors border ${
                          page === p
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border hover:bg-muted text-foreground'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
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

      {/* Edit modal */}
      {editCourse && (
        <EditModal
          course={editCourse}
          onSave={saveEdit}
          onClose={() => setEditCourse(null)}
        />
      )}
    </div>
  );
}
