'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X, ArrowRight } from 'lucide-react';
import type { CourseCategory } from '@/config/courses';
import type { DbCourse } from '@/types/course';
import { FACETS, SORTS, sortCourses, matchesSearch, compareAgeRange, type CatalogCourse, type FacetKey, type SortValue } from '@/lib/course-catalog-filters';
import { CourseCard } from './CourseCard';

export type { CatalogCourse };

// ── Component ──────────────────────────────────────────────────────────────

export function CourseCatalogClient({ courses, categories }: { courses: CatalogCourse[]; categories: CourseCategory[] }) {
  const pathname = usePathname();
  const params = useSearchParams();

  const category = params.get('category') ?? 'all';
  const sort = (SORTS.some((s) => s.value === params.get('sort')) ? params.get('sort') : 'recommended') as SortValue;
  const selected = useMemo(() => {
    const out = {} as Record<FacetKey, string[]>;
    for (const f of FACETS) out[f.key] = params.get(f.key)?.split(',').filter(Boolean) ?? [];
    return out;
  }, [params]);

  // Search box is local state (instant typing), synced to the URL after a short pause.
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [showFilters, setShowFilters] = useState(false);

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      // Build from the live URL, not the render-time params: a pending navigation (e.g. the
      // debounced search firing right after "Clear all") must never resurrect stale filters.
      const next = new URLSearchParams(window.location.search);
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === '' || (k === 'category' && v === 'all') || (k === 'sort' && v === 'recommended')) next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      // Native history API (Next syncs useSearchParams with it): filtering is purely
      // client-side, so this avoids a server re-render of the page on every click.
      window.history.replaceState(null, '', `${pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
    },
    [pathname],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      const current = new URLSearchParams(window.location.search).get('q') ?? '';
      if (current !== query.trim()) update({ q: query.trim() || null });
    }, 250);
    return () => clearTimeout(t);
  }, [query, update]);

  // Keep the box in sync when the URL changes elsewhere (back button, chips, deep links).
  const urlQuery = params.get('q') ?? '';
  useEffect(() => {
    setQuery((q) => (q.trim() === urlQuery ? q : urlQuery));
  }, [urlQuery]);

  // Old links used /digitika#<categoryId>; map them onto the tab.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && categories.some((c) => c.id === hash)) {
      update({ category: hash });
      document.getElementById('courses')?.scrollIntoView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryOrder = useMemo(() => new Map(categories.map((c, i) => [c.id, i])), [categories]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const searchTerm = params.get('q') ?? '';

  // Scope = search + facet filters; tab counts use the scope so they reflect what you'd see.
  const passesFacets = useCallback(
    (c: CatalogCourse, except?: FacetKey) =>
      FACETS.every((f) => f.key === except || selected[f.key].length === 0 || f.match(c).some((v) => selected[f.key].includes(v))),
    [selected],
  );
  const scoped = useMemo(() => courses.filter((c) => matchesSearch(c, searchTerm) && passesFacets(c)), [courses, searchTerm, passesFacets]);
  const tabCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of scoped) m.set(c.categoryId, (m.get(c.categoryId) ?? 0) + 1);
    return m;
  }, [scoped]);

  const activeCategory = category !== 'all' && categoryById.has(category) ? category : 'all';
  const results = useMemo(
    () => sortCourses(activeCategory === 'all' ? scoped : scoped.filter((c) => c.categoryId === activeCategory), sort, categoryOrder),
    [scoped, activeCategory, sort, categoryOrder],
  );

  // Facet option counts: courses in the current tab + search, applying all OTHER facets.
  const facetOptions = useMemo(() => {
    const inTab = courses.filter((c) => (activeCategory === 'all' || c.categoryId === activeCategory) && matchesSearch(c, searchTerm));
    return FACETS.map((f) => {
      const base = inTab.filter((c) => passesFacets(c, f.key));
      const counts = new Map<string, number>();
      for (const c of base) for (const v of f.match(c)) counts.set(v, (counts.get(v) ?? 0) + 1);
      const options =
        f.key === 'age'
          ? [...new Set(inTab.flatMap(f.match))].sort(compareAgeRange).map((v) => ({ value: v, label: `Ages ${v}` }))
          : f.options;
      // Hide options no course in this tab can ever match; keep selected ones visible.
      const visible = options.filter((o) => inTab.some((c) => f.match(c).includes(o.value)) || selected[f.key].includes(o.value));
      return { ...f, visible, counts };
    }).filter((f) => f.visible.length > 0);
  }, [courses, activeCategory, searchTerm, passesFacets, selected]);

  const toggle = (key: FacetKey, value: string) => {
    const cur = selected[key];
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    update({ [key]: next.join(',') || null });
  };

  const activeChips = FACETS.flatMap((f) =>
    selected[f.key].map((v) => ({
      key: f.key,
      value: v,
      label: f.key === 'age' ? `Ages ${v}` : f.options.find((o) => o.value === v)?.label ?? v,
    })),
  );
  const hasFilters = activeChips.length > 0 || Boolean(searchTerm);
  const clearAll = () => {
    setQuery('');
    update({ q: null, ...Object.fromEntries(FACETS.map((f) => [f.key, null])) });
  };

  const grouped = activeCategory === 'all' && sort === 'recommended';
  const activeFilterCount = activeChips.length;

  const filterPanel = (
    <div className="space-y-6">
      {facetOptions.map((f) => (
        <fieldset key={f.key}>
          <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{f.label}</legend>
          <div className="space-y-1">
            {f.visible.map((o) => {
              const checked = selected[f.key].includes(o.value);
              const count = f.counts.get(o.value) ?? 0;
              return (
                <label
                  key={o.value}
                  className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm cursor-pointer hover:bg-muted ${count === 0 && !checked ? 'opacity-50' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={checked} onChange={() => toggle(f.key, o.value)} className="h-4 w-4 rounded accent-[hsl(var(--primary))]" />
                    <span className="text-foreground">{o.label}</span>
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      {hasFilters && (
        <button onClick={clearAll} className="text-sm font-semibold text-primary hover:underline">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div>
      {/* Toolbar: search, sort, mobile filter toggle (sticky under the fixed navbar) */}
      <div className="sticky top-20 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="relative flex-1">
            <span className="sr-only">Search courses</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, skills or tools (e.g. Python, CCNA, kids)"
              className="w-full h-11 pl-9 pr-9 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground" aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
          <div className="flex gap-2">
            <label className="flex-1 sm:flex-none">
              <span className="sr-only">Sort by</span>
              <select
                value={sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <button
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              className="lg:hidden inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-foreground"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div role="tablist" aria-label="Course categories" className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {[{ id: 'all', name: 'All courses', color: 'hsl(var(--primary))' }, ...categories].map((c) => {
            const count = c.id === 'all' ? scoped.length : tabCounts.get(c.id) ?? 0;
            const active = activeCategory === c.id;
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={active}
                onClick={() => update({ category: c.id })}
                className={`shrink-0 inline-flex items-center gap-2 h-9 px-4 rounded-full text-sm font-semibold border transition-colors ${
                  active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:border-primary/40'
                }`}
              >
                {c.id !== 'all' && <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />}
                {c.name}
                <span className={`text-xs tabular-nums ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex gap-8">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-52">{filterPanel}</div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Mobile filters */}
          {showFilters && (
            <div className="lg:hidden mb-6 rounded-2xl border border-border bg-card p-4">
              {filterPanel}
              <button onClick={() => setShowFilters(false)} className="mt-4 w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
                Show {results.length} course{results.length === 1 ? '' : 's'}
              </button>
            </div>
          )}

          {/* Result summary + active filter chips */}
          <div className="flex flex-wrap items-center gap-2 mb-5" aria-live="polite">
            <p className="text-sm text-muted-foreground mr-2">
              Showing <span className="font-semibold text-foreground">{results.length}</span> of {courses.length} courses
              {activeCategory !== 'all' && <> in <span className="font-semibold text-foreground">{categoryById.get(activeCategory)?.name}</span></>}
              {searchTerm && <> for &ldquo;<span className="font-semibold text-foreground">{searchTerm}</span>&rdquo;</>}
            </p>
            {activeChips.map((chip) => (
              <button
                key={`${chip.key}:${chip.value}`}
                onClick={() => toggle(chip.key, chip.value)}
                className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20"
                aria-label={`Remove filter ${chip.label}`}
              >
                {chip.label} <X className="h-3 w-3" />
              </button>
            ))}
            {hasFilters && (
              <button onClick={clearAll} className="text-xs font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2">
                Clear all
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="font-bold text-foreground">No courses match these filters</p>
              <p className="text-sm text-muted-foreground mt-1">Try removing a filter or searching for something broader.</p>
              <button onClick={clearAll} className="mt-4 h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
                Show all courses
              </button>
            </div>
          ) : grouped ? (
            <div className="space-y-12">
              {categories.map((cat) => {
                const list = results.filter((c) => c.categoryId === cat.id);
                if (list.length === 0) return null;
                return (
                  <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
                    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: cat.color }}>{cat.tagline}</p>
                        <h3 id={`cat-${cat.id}`} className="text-2xl font-black text-foreground tracking-tight">{cat.name}</h3>
                        {cat.description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{cat.description}</p>}
                      </div>
                      <button onClick={() => update({ category: cat.id })} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                        Only {cat.name} ({list.length}) <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
                      {list.map((course) => <CourseCard key={course.id} course={course as DbCourse} category={cat} />)}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <>
              {activeCategory !== 'all' && categoryById.get(activeCategory)?.description && (
                <p className="text-sm text-muted-foreground mb-5 max-w-3xl">{categoryById.get(activeCategory)!.description}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
                {results.map((course) => (
                  <CourseCard key={course.id} course={course as DbCourse} category={categoryById.get(course.categoryId)!} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
