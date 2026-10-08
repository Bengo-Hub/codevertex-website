// Public /digitika catalog: facet matching, search and sorting.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACETS, sortCourses, matchesSearch, compareAgeRange, weeks, type CatalogCourse } from '../src/lib/course-catalog-filters';
import { COURSES } from '../prisma/seed/courses';

const catalog = COURSES.map(({ metadata, seedVersion: _v, ...c }) => ({
  ...c,
  shortName: c.shortName ?? null,
  longDescription: c.longDescription ?? null,
  audience: c.audience ?? null,
  stack: c.stack ?? null,
  featured: c.featured ?? false,
  isActive: true,
  installmentsEnabled: true,
  ageRange: (metadata as { ageRange?: string } | undefined)?.ageRange,
})) as unknown as CatalogCourse[];
const facet = (key: string) => FACETS.find((f) => f.key === key)!;

test('every seeded course lands in exactly one level, duration and price bucket', () => {
  for (const key of ['level', 'duration', 'price']) {
    for (const c of catalog) assert.equal(facet(key).match(c).length, 1, `${c.id} ${key}`);
  }
});

test('every seeded course matches at least one format', () => {
  for (const c of catalog) assert.ok(facet('format').match(c).length >= 1, `${c.id}: "${c.mode}"`);
});

test('mixed-mode courses match several formats', () => {
  assert.deepEqual(facet('format').match({ mode: 'In-person / Online' } as CatalogCourse).sort(), ['in-person', 'online']);
});

test('search matches across name, stack and outcomes, all terms required', () => {
  const kidsGames = catalog.find((c) => c.id === 'kids-games')!;
  assert.ok(matchesSearch(kidsGames, 'pygame'));
  assert.ok(matchesSearch(kidsGames, 'PYTHON games'));
  assert.equal(matchesSearch(kidsGames, 'python ccna'), false);
  assert.ok(matchesSearch(kidsGames, ''));
});

test('sorting', () => {
  const order = new Map([['kids', 0], ['software', 1]]);
  const prices = sortCourses(catalog, 'price-asc', order).map((c) => c.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  const recommended = sortCourses(catalog, 'recommended', order);
  assert.equal(recommended[0].categoryId, 'kids', 'configured category order comes first');
  assert.equal(weeks('8 weeks'), 8);
  assert.equal(weeks('Self-paced'), null);
});

test('age ranges sort numerically', () => {
  assert.deepEqual(['10-16', '6-10'].sort(compareAgeRange), ['6-10', '10-16']);
});
