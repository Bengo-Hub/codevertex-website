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
  payments: typeof import('../src/lib/enrollment-payments');
};
let lib: Lib;

function run(cmd: string, args: string[]) {
  // Windows resolves npx through npx.cmd, which only a shell can start.
  return execFileSync(cmd, args, { env: { ...process.env, DATABASE_URL: DB }, encoding: 'utf8', stdio: 'pipe', shell: process.platform === 'win32' });
}

before(async () => {
  if (!DB) return;
  process.env.DATABASE_URL = DB; // src/lib/db reads it at import time
  run('npx', ['prisma', 'db', 'push', '--url', DB]);
  lib = {
    prisma: (await import('../src/lib/db')).prisma,
    parent: await import('../src/lib/parent-access'),
    progress: await import('../src/lib/student-progress'),
    payments: await import('../src/lib/enrollment-payments'),
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

test('a bumped seedVersion re-applies the course once (kits wording removed)', { skip }, async () => {
  const { prisma } = lib;
  // Simulate production state from the first kids release (v1, with the kits claim).
  const row = await prisma.course.findUniqueOrThrow({ where: { id: 'kids-robotics-ai' } });
  await prisma.course.update({
    where: { id: 'kids-robotics-ai' },
    data: { includes: ['Robotics and electronics kits provided in class'], metadata: { ...(row.metadata as object), _seedVersion: 1 } },
  });
  run('npx', ['tsx', 'prisma/seed.ts']);
  const updated = await prisma.course.findUniqueOrThrow({ where: { id: 'kids-robotics-ai' } });
  assert.doesNotMatch(JSON.stringify(updated.includes), /kits/i);
  assert.equal((updated.metadata as { _seedVersion?: number })._seedVersion, 2);
});

// Payments received (treasury events and admin-recorded deposits) settle the next installment
// and re-spread the balance over the rest.
async function makeEnrollment(rows: number[] | null, total = 30000) {
  const e = await lib.prisma.enrollment.create({
    data: {
      courseId: 'alloc-test', courseName: 'Allocation test', category: 'test', fullName: 'Alloc Test',
      email: `alloc-${Date.now()}-${Math.random()}@example.com`, phone: '+254700000000',
      amount: rows ? rows[0] : total, totalAmount: total, currency: 'KES', paymentPlan: rows ? 'custom' : 'upfront',
    },
  });
  if (rows) {
    await lib.prisma.installmentSchedule.createMany({
      data: rows.map((amount, i) => ({
        enrollmentId: e.id, installmentNo: i + 1, amount, currency: 'KES',
        dueDate: new Date(Date.UTC(2026, 10 + i, 1)), status: 'pending',
      })),
    });
  }
  return e.id;
}
async function schedule(id: bigint) {
  const rows = await lib.prisma.installmentSchedule.findMany({ where: { enrollmentId: id }, orderBy: { installmentNo: 'asc' } });
  return rows.map((r) => `${r.amount}:${r.status}`);
}

test('an underpayment moves the shortfall onto later installments', { skip }, async () => {
  const id = await makeEnrollment([12000, 10000, 8000]);
  await lib.payments.applyEnrollmentPayment(id, 5000, { paymentRef: 'bank_transfer:A1' });
  assert.deepEqual(await schedule(id), ['5000:paid', '12500:pending', '12500:pending']);
  await lib.payments.applyEnrollmentPayment(id, 20000, { paymentRef: 'bank_transfer:A2' });
  assert.deepEqual(await schedule(id), ['5000:paid', '20000:paid', '5000:pending']);
  const last = await lib.payments.applyEnrollmentPayment(id, 5000, { paymentRef: 'cash:A3' });
  assert.equal(last.remainingBalance, 0);
  assert.equal((await lib.prisma.enrollment.findUnique({ where: { id } }))?.paymentStatus, 'succeeded');
});

test('an overpayment shrinks later installments and drops the ones no longer owed', { skip }, async () => {
  const a = await makeEnrollment([12000, 10000, 8000]);
  await lib.payments.applyEnrollmentPayment(a, 25000);
  assert.deepEqual(await schedule(a), ['25000:paid', '2500:pending', '2500:pending']);
  const b = await makeEnrollment([12000, 10000, 8000]);
  const done = await lib.payments.applyEnrollmentPayment(b, 30000);
  assert.deepEqual(await schedule(b), ['30000:paid']);
  assert.equal(done.amountPaid, 30000);
});

test('short on the last installment leaves the rest due, and paid-in-full is refused', { skip }, async () => {
  const id = await makeEnrollment([20000, 10000]);
  await lib.payments.applyEnrollmentPayment(id, 20000);
  await lib.payments.applyEnrollmentPayment(id, 6000);
  assert.deepEqual(await schedule(id), ['20000:paid', '6000:paid', '4000:pending']);
  await lib.payments.applyEnrollmentPayment(id, 4000);
  await assert.rejects(lib.payments.applyEnrollmentPayment(id, 100), lib.payments.PaymentRejected);
});

test('a part-paid upfront enrollment gets a schedule; admin entry cannot overpay', { skip }, async () => {
  const id = await makeEnrollment(null);
  await assert.rejects(
    lib.payments.applyEnrollmentPayment(id, 30001, { rejectOverpayment: true }),
    /more than the balance/,
  );
  const r = await lib.payments.applyEnrollmentPayment(id, 10000, { paymentRef: 'mpesa:QX1', rejectOverpayment: true });
  assert.equal(r.remainingBalance, 20000);
  assert.deepEqual(await schedule(id), ['10000:paid', '20000:pending']);
});
