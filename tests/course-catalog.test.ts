// Course catalog: seed data integrity and the shared admin validation schema.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COURSES } from '../prisma/seed/courses';
import { COHORTS } from '../prisma/seed/cohorts';
import { courseCreateSchema, coursePatchSchema, courseMetadataSchema, mergeCourseMetadata } from '../src/lib/course-schema';
import { COURSE_CATEGORIES, getCategory, planKey, findInstallmentPlan } from '../src/config/courses';

test('course ids and slugs are unique', () => {
  const ids = COURSES.map((c) => c.id);
  const slugs = COURSES.map((c) => c.slug);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(slugs).size, slugs.length);
});

test('every installment plan adds up to the course price', () => {
  for (const c of COURSES) {
    assert.ok(c.installmentPlans.length > 0, `${c.id} has no plans`);
    for (const p of c.installmentPlans) {
      const sum = p.payments.reduce((s, x) => s + x.amount, 0);
      assert.equal(sum, c.price, `${c.id} / ${p.label}`);
      assert.equal(p.totalAmount, c.price, `${c.id} / ${p.label} totalAmount`);
    }
  }
});

test('seeded courses pass the same validation the admin editor uses', () => {
  for (const c of COURSES) {
    const { seedVersion: _v, metadata, ...fields } = c;
    const parsed = courseCreateSchema.safeParse({ ...fields, metadata: metadata ?? {} });
    assert.ok(parsed.success, `${c.id}: ${JSON.stringify(parsed.error?.issues?.[0])}`);
  }
});

test('every seeded category has display config', () => {
  const known = new Set(COURSE_CATEGORIES.map((c) => c.id));
  for (const c of COURSES) assert.ok(known.has(c.categoryId), `${c.id} -> ${c.categoryId}`);
});

test('kids & teens lineup matches the agreed ages and prices', () => {
  const byId = new Map(COURSES.map((c) => [c.id, c]));
  const expected: Record<string, { price: number; age: string }> = {
    'kids-scratch': { price: 8000, age: '6-10' },
    'kids-games': { price: 15000, age: '10-16' },
    'kids-robotics-ai': { price: 15000, age: '10-16' },
  };
  for (const [id, exp] of Object.entries(expected)) {
    const c = byId.get(id);
    assert.ok(c, `${id} missing`);
    assert.equal(c.categoryId, 'kids');
    assert.equal(c.price, exp.price);
    assert.equal((c.metadata as { ageRange?: string }).ageRange, exp.age);
    assert.equal((c.metadata as { curriculum?: unknown[] }).curriculum?.length, 8);
    assert.ok((c.seedVersion ?? 0) >= 1, `${id} needs a seedVersion to replace existing content`);
  }
});

test('every seeded cohort points at a seeded course', () => {
  const ids = new Set(COURSES.map((c) => c.id));
  for (const c of COHORTS) assert.ok(ids.has(c.courseId), c.courseId);
});

test('admin metadata cannot set system keys, and merges keep them', () => {
  assert.equal(courseMetadataSchema.safeParse({ _seedVersion: 0 }).success, false);
  assert.equal(coursePatchSchema.safeParse({ slug: 'Bad Slug' }).success, false);
  assert.equal(coursePatchSchema.safeParse({ coverImage: 'javascript:alert(1)' }).success, false);
  const merged = mergeCourseMetadata({ _seedVersion: 1, schedule: 'old', ageRange: '6-10' }, { schedule: 'new' });
  assert.deepEqual(merged, { _seedVersion: 1, schedule: 'new', ageRange: '6-10' });
});

test('plan keys and category fallback', () => {
  assert.equal(planKey('2 Installments'), '2-installments');
  const plans = COURSES.find((c) => c.id === 'kids-games')!.installmentPlans;
  assert.equal(findInstallmentPlan(plans, '2-installments')?.payments.length, 2);
  assert.equal(findInstallmentPlan('not-an-array', 'upfront'), undefined);
  assert.equal(getCategory('unknown-cat').name, 'Unknown-cat');
});
