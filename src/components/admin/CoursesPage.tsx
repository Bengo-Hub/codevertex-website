'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Check, X, Pencil } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { formatCurrency } from '@/lib/utils';

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

type EditField = { courseId: string; field: 'price' | 'featured' | 'isActive' | 'sortOrder'; value: string };

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<EditField | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ includeInactive: String(includeInactive) });
    const res = await fetch(`/api/admin/courses?${params}`);
    setCourses(await res.json());
    setLoading(false);
  }, [includeInactive]);

  useEffect(() => { load(); }, [load]);

  async function saveField(courseId: string, field: string, value: unknown) {
    setSaving(courseId);
    await fetch(`/api/admin/courses/${courseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    setSaving(null);
    setEdit(null);
    load();
  }

  async function toggleField(courseId: string, field: 'featured' | 'isActive', current: boolean) {
    await saveField(courseId, field, !current);
  }

  const categories = [...new Set(courses.map((c) => c.categoryId))].sort();

  return (
    <div className="max-w-7xl mx-auto">
      <AdminPageHeader
        title="Courses"
        description={`${courses.length} course${courses.length !== 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded"
              />
              Show inactive
            </label>
            <button onClick={load} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading…</div>
      ) : (
        <div className="space-y-8">
          {categories.map((cat) => (
            <div key={cat}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {cat}
              </h3>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        {['Course', 'Level', 'Mode', 'Duration', 'Price', 'Featured', 'Active', 'Order', ''].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {courses.filter((c) => c.categoryId === cat).map((course) => (
                        <tr key={course.id} className={`hover:bg-muted/30 transition-colors ${!course.isActive ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-sm text-foreground">{course.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{course.id}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs capitalize text-muted-foreground">{course.level}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs capitalize text-muted-foreground">{course.mode}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-muted-foreground">{course.duration}</span>
                          </td>
                          <td className="px-4 py-3">
                            {edit?.courseId === course.id && edit.field === 'price' ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  defaultValue={course.price}
                                  className="w-24 text-xs rounded border border-border bg-background px-2 py-1 text-foreground"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveField(course.id, 'price', Number((e.target as HTMLInputElement).value));
                                    if (e.key === 'Escape') setEdit(null);
                                  }}
                                  autoFocus
                                />
                                <button onClick={() => setEdit(null)} className="text-muted-foreground hover:text-foreground">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setEdit({ courseId: course.id, field: 'price', value: String(course.price) })}
                                className="group flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary"
                              >
                                {formatCurrency(course.price, course.currency)}
                                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleField(course.id, 'featured', course.featured)}
                              disabled={saving === course.id}
                              className={`w-8 h-5 rounded-full transition-colors ${course.featured ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                            >
                              <span className={`block w-3 h-3 rounded-full bg-white shadow mx-0.5 transition-transform ${course.featured ? 'translate-x-3.5' : ''}`} />
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleField(course.id, 'isActive', course.isActive)}
                              disabled={saving === course.id}
                              className={`w-8 h-5 rounded-full transition-colors ${course.isActive ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
                            >
                              <span className={`block w-3 h-3 rounded-full bg-white shadow mx-0.5 transition-transform ${course.isActive ? 'translate-x-3.5' : ''}`} />
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            {edit?.courseId === course.id && edit.field === 'sortOrder' ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  defaultValue={course.sortOrder}
                                  className="w-16 text-xs rounded border border-border bg-background px-2 py-1 text-foreground"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveField(course.id, 'sortOrder', Number((e.target as HTMLInputElement).value));
                                    if (e.key === 'Escape') setEdit(null);
                                  }}
                                  autoFocus
                                />
                                <button onClick={() => setEdit(null)} className="text-muted-foreground hover:text-foreground">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setEdit({ courseId: course.id, field: 'sortOrder', value: String(course.sortOrder) })}
                                className="group flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                              >
                                {course.sortOrder}
                                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {saving === course.id && (
                              <span className="text-xs text-muted-foreground">Saving…</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No courses found.</div>
          )}
        </div>
      )}
    </div>
  );
}
