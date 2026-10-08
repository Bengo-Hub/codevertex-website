'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { RefreshCw, Pencil, X, Search, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { authedFetch } from '@/lib/auth/authed-fetch';
import { COURSE_CATEGORIES, getCategory } from '@/config/courses';
import type { DbCourse, InstallmentPlan, WeeklyModule, Testimonial } from '@/types/course';

type InstallmentPayment = InstallmentPlan['payments'][number];

// Mirrors the Prisma Course row as returned by /api/admin/courses.
type Course = Omit<DbCourse, 'createdAt' | 'updatedAt'>;

const PAGE_SIZE = 12;
const INPUT_CLS = 'w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50';

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`w-9 h-5 rounded-full transition-colors shrink-0 ${
        checked ? 'bg-primary' : 'bg-muted-foreground/30'
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

// ── Installment Plan Editor ────────────────────────────────────────────────

function InstallmentPlanEditor({
  plans,
  onChange,
}: {
  plans: InstallmentPlan[];
  onChange: (plans: InstallmentPlan[]) => void;
}) {
  function updatePlan(idx: number, patch: Partial<InstallmentPlan>) {
    onChange(plans.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  function updatePayment(planIdx: number, payIdx: number, patch: Partial<InstallmentPayment>) {
    onChange(
      plans.map((p, i) =>
        i === planIdx
          ? {
              ...p,
              payments: p.payments.map((pay, j) => (j === payIdx ? { ...pay, ...patch } : pay)),
              totalAmount: p.payments
                .map((pay, j) => (j === payIdx ? { ...pay, ...patch } : pay))
                .reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0),
            }
          : p
      )
    );
  }

  function addPayment(planIdx: number) {
    const p = plans[planIdx];
    onChange(
      plans.map((plan, i) =>
        i === planIdx
          ? { ...plan, payments: [...plan.payments, { amount: 0, label: '' }] }
          : plan
      )
    );
  }

  function removePayment(planIdx: number, payIdx: number) {
    onChange(
      plans.map((plan, i) =>
        i === planIdx
          ? {
              ...plan,
              payments: plan.payments.filter((_, j) => j !== payIdx),
              totalAmount: plan.payments
                .filter((_, j) => j !== payIdx)
                .reduce((sum, pay) => sum + pay.amount, 0),
            }
          : plan
      )
    );
  }

  function addPlan() {
    onChange([...plans, { label: 'New Plan', payments: [{ amount: 0, label: 'At enrollment' }], totalAmount: 0 }]);
  }

  function removePlan(idx: number) {
    onChange(plans.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      {plans.map((plan, pidx) => (
        <div key={pidx} className="rounded-lg border border-border bg-background p-3">
          <div className="flex items-center gap-2 mb-2">
            <input
              value={plan.label}
              onChange={(e) => updatePlan(pidx, { label: e.target.value })}
              placeholder="Plan label"
              className="flex-1 text-xs rounded border border-border bg-muted px-2 py-1 text-foreground focus:outline-none"
            />
            <input
              value={plan.badge ?? ''}
              onChange={(e) => updatePlan(pidx, { badge: e.target.value || undefined })}
              placeholder="Badge (e.g. Popular)"
              className="w-28 text-xs rounded border border-border bg-muted px-2 py-1 text-foreground focus:outline-none"
            />
            <button
              onClick={() => removePlan(pidx)}
              className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
              title="Remove plan"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 ml-2">
            {plan.payments.map((pay, payidx) => (
              <div key={payidx} className="flex items-center gap-2">
                <input
                  value={pay.label}
                  onChange={(e) => updatePayment(pidx, payidx, { label: e.target.value })}
                  placeholder="Payment label"
                  className="flex-1 text-xs rounded border border-border bg-muted px-2 py-1 text-foreground focus:outline-none"
                />
                <span className="text-xs text-muted-foreground shrink-0">KES</span>
                <input
                  type="number"
                  min={0}
                  value={pay.amount}
                  onChange={(e) => updatePayment(pidx, payidx, { amount: Number(e.target.value) })}
                  className="w-24 text-xs rounded border border-border bg-muted px-2 py-1 text-foreground focus:outline-none text-right"
                />
                {plan.payments.length > 1 && (
                  <button
                    onClick={() => removePayment(pidx, payidx)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}

            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border">
              <button
                onClick={() => addPayment(pidx)}
                className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80"
              >
                <Plus className="h-2.5 w-2.5" /> Add payment
              </button>
              <span className="text-[10px] text-muted-foreground">
                Total: KES {plan.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addPlan}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 border border-dashed border-primary/30 rounded-lg px-3 py-2 w-full justify-center transition-colors"
      >
        <Plus className="h-3.5 w-3.5" /> Add installment plan
      </button>
    </div>
  );
}

// ── Course editor (create + edit) ──────────────────────────────────────────
// Every section of the public course page (/digitika/[courseId]) is edited here:
// core fields map to Course columns, page-only sections to Course.metadata.

type Tab = 'details' | 'page' | 'curriculum' | 'pricing';

const TABS: { id: Tab; label: string }[] = [
  { id: 'details', label: 'Details' },
  { id: 'page', label: 'Page content' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'pricing', label: 'Pricing' },
];

const linesToList = (v: string) => v.split('\n').map((s) => s.trim()).filter(Boolean);
const listToLines = (v: string[] | undefined) => (v ?? []).join('\n');

function emptyCourse(): Course {
  return {
    id: '', categoryId: COURSE_CATEGORIES[0].id, name: '', shortName: null, slug: '', duration: '', mode: 'In-person (Kisumu)',
    price: 0, currency: 'KES', description: '', longDescription: null, level: 'beginner', audience: null, stack: null,
    coverImage: null, outcomes: [], prerequisites: [], careerPaths: [], includes: [], featured: false, isActive: true,
    installmentsEnabled: false, installmentPlans: [], sortOrder: 0, metadata: {},
  };
}

function LinesField({ label, value, onChange, hint, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; hint?: string; rows?: number }) {
  return (
    <div className="col-span-2">
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label} <span className="font-normal">({hint ?? 'one per line'})</span>
      </label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className={`${INPUT_CLS} resize-y`} />
    </div>
  );
}

function CurriculumEditor({ courseId, weeks, onChange }: { courseId: string; weeks: WeeklyModule[]; onChange: (w: WeeklyModule[]) => void }) {
  const [importing, setImporting] = useState(false);

  function update(idx: number, patch: Partial<WeeklyModule>) {
    onChange(weeks.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  }
  function move(idx: number, dir: -1 | 1) {
    const next = [...weeks];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }

  // Keeps the website outline in sync with what is actually delivered in the LMS:
  // each LMS module becomes a week, its lessons become the topics.
  async function importFromLms() {
    if (!courseId) return;
    setImporting(true);
    const res = await authedFetch(`/api/admin/courses/${courseId}/modules`);
    setImporting(false);
    if (!res.ok) { toast.error('Could not load LMS modules'); return; }
    const modules: { title: string; lessons: { title: string }[] }[] = await res.json();
    if (modules.length === 0) { toast.info('This course has no LMS modules yet'); return; }
    if (weeks.length > 0 && !confirm('Replace the current curriculum with the LMS modules?')) return;
    onChange(modules.map((m, i) => ({ week: i + 1, title: m.title, topics: m.lessons.map((l) => l.title) })));
    toast.success(`Imported ${modules.length} module(s); review and save`);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Shown as the week-by-week curriculum on the course page.</p>
        <button
          onClick={importFromLms}
          disabled={!courseId || importing}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50"
          title={courseId ? 'Build the outline from this course\'s LMS modules and lessons' : 'Save the course first'}
        >
          {importing ? 'Importing…' : 'Import from LMS modules'}
        </button>
      </div>
      {weeks.map((w, idx) => (
        <div key={idx} className="rounded-lg border border-border bg-background p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input value={String(w.week)} onChange={(e) => update(idx, { week: /^\d+$/.test(e.target.value) ? Number(e.target.value) : e.target.value })} className="w-16 text-xs rounded border border-border bg-muted px-2 py-1" title="Week" />
            <input value={w.title} onChange={(e) => update(idx, { title: e.target.value })} placeholder="Module title" className="flex-1 text-xs rounded border border-border bg-muted px-2 py-1" />
            <button onClick={() => move(idx, -1)} className="text-xs px-1 text-muted-foreground hover:text-foreground" title="Move up">↑</button>
            <button onClick={() => move(idx, 1)} className="text-xs px-1 text-muted-foreground hover:text-foreground" title="Move down">↓</button>
            <button onClick={() => onChange(weeks.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive" title="Remove week"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          <textarea value={listToLines(w.topics)} onChange={(e) => update(idx, { topics: linesToList(e.target.value) })} rows={3} placeholder="Topics, one per line" className="w-full text-xs rounded border border-border bg-muted px-2 py-1 resize-y" />
        </div>
      ))}
      <button
        onClick={() => onChange([...weeks, { week: weeks.length + 1, title: '', topics: [] }])}
        className="flex items-center gap-1.5 text-xs text-primary border border-dashed border-primary/30 rounded-lg px-3 py-2 w-full justify-center"
      >
        <Plus className="h-3.5 w-3.5" /> Add week
      </button>
    </div>
  );
}

function TestimonialsEditor({ items, onChange }: { items: Testimonial[]; onChange: (t: Testimonial[]) => void }) {
  const update = (idx: number, patch: Partial<Testimonial>) => onChange(items.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  return (
    <div className="col-span-2 space-y-2">
      <label className="block text-xs font-medium text-muted-foreground">Testimonials</label>
      {items.map((t, idx) => (
        <div key={idx} className="rounded-lg border border-border bg-background p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <input value={t.name} onChange={(e) => update(idx, { name: e.target.value })} placeholder="Name" className="text-xs rounded border border-border bg-muted px-2 py-1" />
            <input value={t.role} onChange={(e) => update(idx, { role: e.target.value })} placeholder="Role" className="text-xs rounded border border-border bg-muted px-2 py-1" />
            <input value={t.company} onChange={(e) => update(idx, { company: e.target.value })} placeholder="Company / school" className="text-xs rounded border border-border bg-muted px-2 py-1" />
          </div>
          <div className="flex gap-2">
            <textarea value={t.quote} onChange={(e) => update(idx, { quote: e.target.value })} rows={2} placeholder="Quote" className="flex-1 text-xs rounded border border-border bg-muted px-2 py-1 resize-y" />
            <button onClick={() => onChange(items.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive" title="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      ))}
      <button onClick={() => onChange([...items, { name: '', role: '', company: '', quote: '' }])} className="flex items-center gap-1.5 text-xs text-primary border border-dashed border-primary/30 rounded-lg px-3 py-2 w-full justify-center">
        <Plus className="h-3.5 w-3.5" /> Add testimonial
      </button>
    </div>
  );
}

function EditModal({
  course,
  isNew,
  categoryIds,
  onSave,
  onClose,
}: {
  course: Course;
  isNew: boolean;
  categoryIds: string[];
  onSave: (id: string | null, data: Record<string, unknown>) => Promise<boolean>;
  onClose: () => void;
}) {
  const meta = course.metadata ?? {};
  const [form, setForm] = useState({
    id: course.id,
    slug: course.slug,
    categoryId: course.categoryId,
    name: course.name,
    shortName: course.shortName ?? '',
    duration: course.duration,
    mode: course.mode,
    level: course.level,
    audience: course.audience ?? '',
    stack: course.stack ?? '',
    coverImage: course.coverImage ?? '',
    description: course.description,
    longDescription: course.longDescription ?? '',
    price: String(course.price),
    sortOrder: String(course.sortOrder),
    outcomes: listToLines(course.outcomes),
    prerequisites: listToLines(course.prerequisites),
    careerPaths: listToLines(course.careerPaths),
    includes: listToLines(course.includes),
    installmentsEnabled: course.installmentsEnabled,
    installmentPlans: course.installmentPlans ?? [],
    // metadata
    ageRange: meta.ageRange ?? '',
    schedule: meta.schedule ?? '',
    location: meta.location ?? '',
    cohortSize: meta.cohortSize ? String(meta.cohortSize) : '',
    brochure: meta.brochure ?? '',
    showAlumni: meta.showAlumni ?? false,
    highlights: listToLines(meta.highlights),
    requirements: listToLines(meta.requirements),
    curriculum: meta.curriculum ?? [],
    testimonials: meta.testimonials ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>('details');
  const overlayRef = useRef<HTMLDivElement>(null);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSave() {
    setSaving(true);
    const plans = form.installmentPlans.map((p) => ({
      ...p,
      totalAmount: p.payments.reduce((s, pay) => s + (Number(pay.amount) || 0), 0),
    }));
    const payload: Record<string, unknown> = {
      ...(isNew ? { id: form.id.trim() } : {}),
      slug: form.slug.trim(),
      categoryId: form.categoryId.trim(),
      name: form.name,
      shortName: form.shortName || null,
      duration: form.duration,
      mode: form.mode,
      level: form.level,
      audience: form.audience || null,
      stack: form.stack || null,
      coverImage: form.coverImage || null,
      description: form.description,
      longDescription: form.longDescription || null,
      price: Number(form.price),
      sortOrder: Number(form.sortOrder),
      outcomes: linesToList(form.outcomes),
      prerequisites: linesToList(form.prerequisites),
      careerPaths: linesToList(form.careerPaths),
      includes: linesToList(form.includes),
      installmentsEnabled: form.installmentsEnabled,
      installmentPlans: plans,
      metadata: {
        ageRange: form.ageRange.trim(),
        schedule: form.schedule.trim(),
        location: form.location.trim(),
        ...(form.cohortSize ? { cohortSize: Number(form.cohortSize) } : {}),
        brochure: form.brochure.trim(),
        showAlumni: form.showAlumni,
        highlights: linesToList(form.highlights),
        requirements: linesToList(form.requirements),
        curriculum: form.curriculum
          .filter((w) => w.title.trim())
          .map((w) => ({ ...w, title: w.title.trim(), topics: w.topics.filter(Boolean) })),
        testimonials: form.testimonials.filter((t) => t.name.trim() && t.quote.trim()),
      },
    };
    const ok = await onSave(isNew ? null : course.id, payload);
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">{isNew ? 'New Course' : 'Edit Course'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
              {isNew ? 'Everything here appears on the public course page.' : `${course.name} · /digitika/${course.id}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex border-b border-border px-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto px-6 py-4">
          {tab === 'details' && (
            <div className="grid grid-cols-2 gap-4">
              {isNew && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Course ID (URL, permanent)</label>
                  <input value={form.id} onChange={(e) => set('id', e.target.value.toLowerCase())} placeholder="e.g. kids-ai-lab" className={INPUT_CLS} />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Slug</label>
                <input value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} placeholder="e.g. young-innovators-ai" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className={INPUT_CLS}>
                  {categoryIds.map((id) => <option key={id} value={id}>{getCategory(id).name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Course Name</label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Short Name</label>
                <input value={form.shortName} onChange={(e) => set('shortName', e.target.value)} placeholder="e.g. Tech Explorers" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Audience</label>
                <input value={form.audience} onChange={(e) => set('audience', e.target.value)} placeholder="e.g. Kids (Age 6-10)" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Duration</label>
                <input value={form.duration} onChange={(e) => set('duration', e.target.value)} placeholder="e.g. 8 weeks" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Mode</label>
                <input value={form.mode} onChange={(e) => set('mode', e.target.value)} className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Level</label>
                <select value={form.level} onChange={(e) => set('level', e.target.value)} className={INPUT_CLS}>
                  {['beginner', 'intermediate', 'advanced'].map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} className={INPUT_CLS} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Cover image (/images/... path or https URL)</label>
                <input value={form.coverImage} onChange={(e) => set('coverImage', e.target.value)} className={INPUT_CLS} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Short Description (cards, search results)</label>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className={`${INPUT_CLS} resize-none`} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Long Description</label>
                <textarea value={form.longDescription} onChange={(e) => set('longDescription', e.target.value)} rows={5} className={`${INPUT_CLS} resize-y`} placeholder="Detailed course description shown on the course page…" />
              </div>
            </div>
          )}

          {tab === 'page' && (
            <div className="grid grid-cols-2 gap-4">
              <LinesField label="What you'll achieve (outcomes)" value={form.outcomes} onChange={(v) => set('outcomes', v)} />
              <LinesField label="Everything included" value={form.includes} onChange={(v) => set('includes', v)} />
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Tech stack (comma separated)</label>
                <input value={form.stack} onChange={(e) => set('stack', e.target.value)} className={INPUT_CLS} />
              </div>
              <LinesField label="Prerequisites" value={form.prerequisites} onChange={(v) => set('prerequisites', v)} rows={3} />
              <LinesField label="What to bring" value={form.requirements} onChange={(v) => set('requirements', v)} rows={3} />
              <LinesField label="Career pathways" value={form.careerPaths} onChange={(v) => set('careerPaths', v)} rows={3} />
              <LinesField label="Hero highlights" value={form.highlights} onChange={(v) => set('highlights', v)} hint="one per line, max 8" rows={3} />
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Age range (kids courses)</label>
                <input value={form.ageRange} onChange={(e) => set('ageRange', e.target.value)} placeholder="e.g. 10-16" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Cohort size</label>
                <input type="number" min={1} value={form.cohortSize} onChange={(e) => set('cohortSize', e.target.value)} className={INPUT_CLS} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Schedule</label>
                <input value={form.schedule} onChange={(e) => set('schedule', e.target.value)} placeholder="e.g. Saturdays 9am-12pm" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Location</label>
                <input value={form.location} onChange={(e) => set('location', e.target.value)} className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Brochure (PDF path or URL)</label>
                <input value={form.brochure} onChange={(e) => set('brochure', e.target.value)} className={INPUT_CLS} />
              </div>
              <div className="col-span-2 flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-foreground">Show alumni companies strip</p>
                <Toggle checked={form.showAlumni} onChange={() => set('showAlumni', !form.showAlumni)} />
              </div>
              <TestimonialsEditor items={form.testimonials} onChange={(t) => set('testimonials', t)} />
            </div>
          )}

          {tab === 'curriculum' && (
            <CurriculumEditor courseId={isNew ? '' : course.id} weeks={form.curriculum} onChange={(w) => set('curriculum', w)} />
          )}

          {tab === 'pricing' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Price ({course.currency})</label>
                <input type="number" min={0} value={form.price} onChange={(e) => set('price', e.target.value)} className={INPUT_CLS} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Enable installments</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Allow students to pay in multiple installments</p>
                </div>
                <Toggle checked={form.installmentsEnabled} onChange={() => set('installmentsEnabled', !form.installmentsEnabled)} />
              </div>
              {form.installmentsEnabled && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Payment plans</p>
                  <InstallmentPlanEditor plans={form.installmentPlans} onChange={(plans) => set('installmentPlans', plans)} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : isNew ? 'Create Course' : 'Save Changes'}
          </button>
          {!isNew && (
            <a href={`/digitika/${course.id}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
              View page
            </a>
          )}
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main CoursesPage ───────────────────────────────────────────────────────

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editCourse, setEditCourse] = useState<{ course: Course; isNew: boolean } | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ includeInactive: String(includeInactive) });
    const res = await authedFetch(`/api/admin/courses?${params}`);
    setCourses(res.ok ? await res.json() : []);
    setLoading(false);
  }, [includeInactive]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, categoryFilter, includeInactive]);

  async function saveCourse(id: string | null, data: Record<string, unknown>): Promise<boolean> {
    const res = await authedFetch(id ? `/api/admin/courses/${id}` : '/api/admin/courses', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success(id ? 'Course updated; the website shows it on the next page load' : 'Course created');
      load();
      return true;
    }
    const body = await res.json().catch(() => ({}));
    const issue = body?.issues?.[0];
    toast.error(issue ? `${issue.path?.join('.') || 'Field'}: ${issue.message}` : body?.error ?? 'Failed to save changes');
    return false;
  }

  async function toggleField(courseId: string, field: 'featured' | 'isActive' | 'installmentsEnabled', current: boolean) {
    setToggling(courseId);
    const res = await authedFetch(`/api/admin/courses/${courseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !current }),
    });
    if (res.ok) {
      const labels = { featured: 'Featured', isActive: 'Active', installmentsEnabled: 'Installments' };
      toast.success(`${labels[field]} ${!current ? 'enabled' : 'disabled'}`);
      load();
    } else {
      toast.error('Update failed');
    }
    setToggling(null);
  }

  const categories = [...new Set(courses.map(c => c.categoryId))].sort();
  const categoryIds = [...new Set([...COURSE_CATEGORIES.map(c => c.id), ...categories])];

  const filtered = courses.filter(c => {
    if (categoryFilter && c.categoryId !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || c.level.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const paginatedCategories = [...new Set(paginated.map(c => c.categoryId))].sort();

  return (
    <div className="max-w-7xl mx-auto">
      <AdminPageHeader
        title="Courses"
        description={`${filtered.length} course${filtered.length !== 1 ? 's' : ''}${search || categoryFilter ? ' (filtered)' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditCourse({ course: emptyCourse(), isNew: true })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> New course
            </button>
            <button onClick={load} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        >
          <option value="">All categories</option>
          {categories.map(cat => <option key={cat} value={cat}>{getCategory(cat).name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
          <input type="checkbox" checked={includeInactive} onChange={e => setIncludeInactive(e.target.checked)} className="rounded" />
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
            {paginatedCategories.map(cat => (
              <div key={cat}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  {getCategory(cat).name}
                  <span className="font-normal normal-case tracking-normal">
                    ({paginated.filter(c => c.categoryId === cat).length})
                  </span>
                </h3>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          {['Course', 'Level', 'Mode', 'Duration', 'Price', 'Featured', 'Active', 'Instl.', 'Plans', 'Order', ''].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {paginated.filter(c => c.categoryId === cat).map(course => (
                          <tr key={course.id} className={`hover:bg-muted/30 transition-colors ${!course.isActive ? 'opacity-50' : ''}`}>
                            <td className="px-4 py-3 min-w-48">
                              <p className="font-medium text-sm text-foreground">{course.name}</p>
                              {course.shortName && <p className="text-xs text-muted-foreground">{course.shortName}</p>}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-xs capitalize text-muted-foreground">{course.level}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-xs text-muted-foreground">{course.mode}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-xs text-muted-foreground">{course.duration}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-xs font-semibold text-foreground">{formatCurrency(course.price, course.currency)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <Toggle checked={course.featured} onChange={() => toggleField(course.id, 'featured', course.featured)} disabled={toggling === course.id} />
                            </td>
                            <td className="px-4 py-3">
                              <Toggle checked={course.isActive} onChange={() => toggleField(course.id, 'isActive', course.isActive)} disabled={toggling === course.id} />
                            </td>
                            <td className="px-4 py-3">
                              <Toggle checked={course.installmentsEnabled} onChange={() => toggleField(course.id, 'installmentsEnabled', course.installmentsEnabled)} disabled={toggling === course.id} />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-xs text-muted-foreground">
                                {course.installmentPlans?.length ?? 0} plan{(course.installmentPlans?.length ?? 0) !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-muted-foreground">{course.sortOrder}</span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setEditCourse({ course, isNew: false })}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Pencil className="h-3 w-3" /> Edit
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
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '…' ? (
                      <span key={`e-${i}`} className="px-1 text-muted-foreground text-xs">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`min-w-8 h-8 rounded-lg text-xs font-medium transition-colors border ${
                          page === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted text-foreground'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {editCourse && (
        <EditModal
          course={editCourse.course}
          isNew={editCourse.isNew}
          categoryIds={categoryIds}
          onSave={saveCourse}
          onClose={() => setEditCourse(null)}
        />
      )}
    </div>
  );
}
