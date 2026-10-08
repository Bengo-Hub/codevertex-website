import type { DbCourse } from '@/types/course';

/** Lean course shape the public catalog needs (no page metadata beyond the age range). */
export type CatalogCourse = Omit<DbCourse, 'metadata' | 'createdAt' | 'updatedAt'> & { ageRange?: string };

// ── Facets ─────────────────────────────────────────────────────────────────
// Derived from course fields so admins never maintain filter tags separately.
// Facet set follows the large catalogs (Coursera, Codecademy, DataCamp): level,
// format, duration and price, plus age for the kids & teens programmes.

export type FacetKey = 'level' | 'format' | 'duration' | 'price' | 'age';

export interface FacetDef {
  key: FacetKey;
  label: string;
  options: { value: string; label: string }[];
  /** Values a course matches (a course can match several, e.g. "In-person / Online"). */
  match: (c: CatalogCourse) => string[];
}

export function weeks(duration: string): number | null {
  const m = duration.match(/(\d+)\s*week/i);
  return m ? Number(m[1]) : null;
}

export const FACETS: FacetDef[] = [
  {
    key: 'level',
    label: 'Level',
    options: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
    ],
    match: (c) => [c.level],
  },
  {
    key: 'format',
    label: 'Format',
    options: [
      { value: 'in-person', label: 'In-person (Kisumu)' },
      { value: 'online', label: 'Online' },
      { value: 'hybrid', label: 'Hybrid' },
    ],
    match: (c) => {
      const m = c.mode.toLowerCase();
      const out: string[] = [];
      if (m.includes('in-person') || m.includes('kisumu')) out.push('in-person');
      if (m.includes('online')) out.push('online');
      if (m.includes('hybrid')) out.push('hybrid');
      return out;
    },
  },
  {
    key: 'duration',
    label: 'Duration',
    options: [
      { value: 'short', label: 'Up to 4 weeks' },
      { value: 'medium', label: '5 to 8 weeks' },
      { value: 'long', label: '9+ weeks' },
    ],
    match: (c) => {
      const w = weeks(c.duration);
      if (w === null) return [];
      return [w <= 4 ? 'short' : w <= 8 ? 'medium' : 'long'];
    },
  },
  {
    key: 'price',
    label: 'Price',
    options: [
      { value: 'under-10k', label: 'Under KES 10,000' },
      { value: '10k-25k', label: 'KES 10,000 to 25,000' },
      { value: 'over-25k', label: 'Over KES 25,000' },
    ],
    match: (c) => [c.price < 10000 ? 'under-10k' : c.price <= 25000 ? '10k-25k' : 'over-25k'],
  },
  {
    key: 'age',
    label: 'Age group',
    options: [], // built from the ageRange values present (e.g. 6-10, 10-16)
    match: (c) => (c.ageRange ? [c.ageRange] : []),
  },
];

export const SORTS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'duration', label: 'Shortest first' },
  { value: 'name', label: 'Name (A to Z)' },
] as const;
export type SortValue = (typeof SORTS)[number]['value'];

export function sortCourses(list: CatalogCourse[], sort: SortValue, categoryOrder: Map<string, number>): CatalogCourse[] {
  const byRecommended = (a: CatalogCourse, b: CatalogCourse) =>
    (categoryOrder.get(a.categoryId) ?? 99) - (categoryOrder.get(b.categoryId) ?? 99) ||
    Number(b.featured) - Number(a.featured) ||
    a.sortOrder - b.sortOrder;
  const sorted = [...list];
  switch (sort) {
    case 'price-asc': return sorted.sort((a, b) => a.price - b.price || byRecommended(a, b));
    case 'price-desc': return sorted.sort((a, b) => b.price - a.price || byRecommended(a, b));
    case 'duration': return sorted.sort((a, b) => (weeks(a.duration) ?? 999) - (weeks(b.duration) ?? 999) || byRecommended(a, b));
    case 'name': return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default: return sorted.sort(byRecommended);
  }
}

export function matchesSearch(c: CatalogCourse, q: string): boolean {
  if (!q) return true;
  const haystack = [c.name, c.shortName, c.description, c.stack, c.audience, ...c.outcomes].filter(Boolean).join(' ').toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((term) => haystack.includes(term));
}

/** Orders age ranges numerically ("6-10" before "10-16"). */
export function compareAgeRange(a: string, b: string): number {
  return (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0) || a.localeCompare(b);
}
