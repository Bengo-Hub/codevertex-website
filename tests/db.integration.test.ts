// Database integration tests. Opt-in: set TEST_DATABASE_URL to an EMPTY, throwaway
// Postgres database (tests write to it; recreate it before each run). Example:
//   TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5432/cvw_test pnpm test
// Covers: schema push, non-destructive seed upgrades, parent one-time-code flow,
// per-course progress aggregation.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const DB = process.env.TEST_DATABASE_URL;
const skip = !DB && 'TEST_DATABASE_URL not set';

type Lib = {
  prisma: typeof import('../src/lib/db').prisma;
  parent: typeof import('../src/lib/parent-access');
  progress: typeof import('../src/lib/student-progress');
};
let lib: Lib;

function run(cmd: string, args: string[]) {
  return execFileSync(cmd, args, { env: { ...process.env, DATABASE_URL: DB }, encoding: 'utf8', stdio: 'pipe' });
}

before(async () => {
  if (!DB) return;
  process.env.DATABASE_URL = DB; // src/lib/db reads it at import time
  run('npx', ['prisma', 'db', 'push', '--url', DB]);
  lib = {
    prisma: (await import('../src/lib/db')).prisma,
    parent: await import('../src/lib/parent-access'),
    progress: await import('../src/lib/student-progress'),
  };
});

after(async () => {
  if (DB) await lib.prisma.$disconnect();
});

test('seed creates the catalog, keeps admin edits, and is idempotent', { skip }, async () => {
  const { prisma } = lib;
  run('npx', ['tsx', 'prisma/seed.ts']);
  const kids = await prisma.course.findMany({ where: { categoryId: 'kids' }, orderBy: { sortOrder: 'asc' } });
  assert.deepEqual(kids.map((c) => [c.id, c.price]), [['kids-scratch', 8000], ['kids-games', 15000], ['kids-robotics-ai', 15000]]);

  // Admin edits (column + metadata) must survive a redeploy.
  const meta = (await prisma.course.findUniqueOrThrow({ where: { id: 'kids-games' } })).metadata as Record<string, unknown>;
  await prisma.course.update({ where: { id: 'kids-games' }, data: { price: 15500, metadata: { ...meta, schedule: 'Sundays' } } });
  await prisma.cohort.updateMany({ where: { courseId: 'kids-games' }, data: { maxSlots: 3 } });
  const second = run('npx', ['tsx', 'prisma/seed.ts']);
  assert.match(second, /Created 0, kept \d+ existing/);

  const after = await prisma.course.findUniqueOrThrow({ where: { id: 'kids-games' } });
  assert.equal(after.price, 15500);
  assert.equal((after.metadata as Record<string, unknown>).schedule, 'Sundays');
  assert.ok((await prisma.cohort.findMany({ where: { courseId: 'kids-games' } })).every((c) => c.maxSlots === 3));
});

test('seed backfills missing page content on admin-managed courses', { skip }, async () => {
  const { prisma } = lib;
  await prisma.course.update({ where: { id: 'code-starter' }, data: { metadata: { _seedVersion: 0 } } });
  run('npx', ['tsx', 'prisma/seed.ts']);
  const meta = (await prisma.course.findUniqueOrThrow({ where: { id: 'code-starter' } })).metadata as { curriculum?: unknown[] };
  assert.equal(meta.curriculum?.length, 10);
});

test('parent code flow: request, wrong code, verify once, rate limit', { skip }, async () => {
  const { prisma, parent } = lib;
  await prisma.studentUser.create({ data: { id: 'DGT-PARENT23', email: 'mum@example.com', fullName: 'Baraka Ouma', phone: '+254700000123' } });

  // Capture the code from the non-production console line (notifications are not configured in tests).
  const original = console.log;
  let code = '';
  console.log = (...args: unknown[]) => {
    const m = String(args[0]).match(/parent access code for .*: (\d{6})$/);
    if (m) code = m[1];
  };
  try {
    const res = await parent.requestParentCode('DGT-PARENT23', '41.90.0.1');
    assert.equal(res.ok, true);
  } finally {
    console.log = original;
  }
  assert.match(code, /^\d{6}$/);

  const stored = await prisma.parentAccessCode.findFirstOrThrow({ where: { studentUserId: 'DGT-PARENT23' } });
  assert.notEqual(stored.codeHash, code, 'code must never be stored in clear');

  const wrong = code === '000000' ? '111111' : '000000';
  assert.equal((await parent.verifyParentCode('DGT-PARENT23', wrong)).ok, false);
  const ok = await parent.verifyParentCode('DGT-PARENT23', code);
  assert.equal(ok.ok, true);
  assert.equal((await parent.verifyParentCode('DGT-PARENT23', code)).ok, false, 'codes are single-use');

  // Unknown IDs are recorded (no student) so probing counts toward the IP limit.
  const unknown = await parent.requestParentCode('DGT-NOPE2345', '41.90.0.1');
  assert.equal(unknown.ok, false);
  assert.equal(await prisma.parentAccessCode.count({ where: { studentUserId: null } }), 1);

  // Per-student limit: 3 per hour.
  console.log = () => {};
  try {
    await parent.requestParentCode('DGT-PARENT23', '41.90.0.2');
    await parent.requestParentCode('DGT-PARENT23', '41.90.0.3');
    const limited = await parent.requestParentCode('DGT-PARENT23', '41.90.0.4');
    assert.deepEqual(limited.ok ? 200 : limited.status, 429);
  } finally {
    console.log = original;
  }
});

test('per-course progress is aggregated in one query', { skip }, async () => {
  const { prisma, progress } = lib;
  const mod = await prisma.courseModule.create({ data: { courseId: 'kids-robotics-ai', title: 'Week 1' } });
  const lessons = await Promise.all(['a', 'b', 'c', 'd'].map((t) => prisma.lesson.create({ data: { moduleId: mod.id, title: t } })));
  await prisma.lessonProgress.create({ data: { lessonId: lessons[0].id, studentUserId: 'DGT-PARENT23', completedAt: new Date() } });
  await prisma.lessonProgress.create({ data: { lessonId: lessons[1].id, studentUserId: 'DGT-PARENT23' } });

  const map = await progress.getCourseProgress('DGT-PARENT23', ['kids-robotics-ai', 'kids-games']);
  assert.deepEqual(
    [map.get('kids-robotics-ai')?.totalLessons, map.get('kids-robotics-ai')?.completedLessons, map.get('kids-robotics-ai')?.percent],
    [4, 1, 25],
  );
  assert.equal(map.get('kids-games')?.totalLessons, 0);
});
