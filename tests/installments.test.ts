// Payment schedules: preset plans, custom plans within course rules, balance summaries.
// Pure functions, no database.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_INSTALLMENT_POLICY as P,
  buildCustomSchedule,
  coursePolicy,
  customLimits,
  resolveSchedule,
  scalePresetPlan,
  splitEvenly,
  summarizeEnrollmentPayments,
} from '../src/lib/installments';

const today = new Date('2026-10-13T00:00:00Z');
const threeWay = {
  label: '3 Installments',
  totalAmount: 30000,
  payments: [{ amount: 12000, label: 'Week 1 (enroll)' }, { amount: 10000, label: 'Week 4' }, { amount: 8000, label: 'Week 7' }],
};
const amounts = (r: ReturnType<typeof buildCustomSchedule>) => (r.ok ? r.payments.map((p) => p.amount) : r.error);

test('splitEvenly rounds to 100 and always adds up', () => {
  assert.deepEqual(splitEvenly(25000, 2), [12500, 12500]);
  assert.deepEqual(splitEvenly(23777, 2), [11800, 11977]);
  for (const [amt, n] of [[1, 3], [99, 2], [100001, 7]] as const) {
    assert.equal(splitEvenly(amt, n).reduce((a, b) => a + b, 0), amt);
  }
  assert.deepEqual(splitEvenly(500, 0), []);
});

test('a 30k course: 5k deposit then two payments of 12.5k', () => {
  assert.deepEqual(customLimits(P, 30000), { minDeposit: 4500, maxDeposit: 29000, counts: [2, 3] });
  const r = buildCustomSchedule(P, 30000, 5000, 3, 'KES', today);
  assert.deepEqual(amounts(r), [5000, 12500, 12500]);
  assert.ok(r.ok && r.payments[1].dueDate.toISOString().startsWith('2026-11-10'));
});

test('custom plans outside the rules are refused', () => {
  assert.match(String(amounts(buildCustomSchedule(P, 30000, 4000, 3, 'KES', today))), /at least KES 4,500/);
  assert.match(String(amounts(buildCustomSchedule(P, 30000, 5000, 4, 'KES', today))), /between 2 and 3/);
  assert.match(String(amounts(buildCustomSchedule(P, 30000, 30000, 2, 'KES', today))), /Upfront/);
});

test('the final date limit tightens the spacing', () => {
  const r = buildCustomSchedule({ ...P, maxSpanDays: 60, maxInstallments: 4 }, 30000, 6000, 4, 'KES', today);
  assert.ok(r.ok);
  assert.equal(r.payments[3].dueDate.toISOString().slice(0, 10), '2026-12-12');
});

test('discounted preset plans add up to the discounted total exactly', () => {
  const rows = scalePresetPlan(threeWay, 27001, today);
  assert.equal(rows.reduce((s, p) => s + p.amount, 0), 27001);
});

test('resolveSchedule only builds plans the course has', () => {
  const base = { plans: [threeWay], installmentsEnabled: true, total: 30000, currency: 'KES', today };
  assert.equal(resolveSchedule({ ...base, policy: null, paymentPlan: 'hacked' }).ok, false);
  assert.equal(resolveSchedule({ ...base, policy: null, paymentPlan: 'custom', custom: { deposit: 5000, count: 3 } }).ok, false);
  const ok = resolveSchedule({ ...base, policy: P, paymentPlan: 'custom', custom: { deposit: 5000, count: 3 } });
  assert.ok(ok.ok && ok.payments.length === 3);
  assert.deepEqual(resolveSchedule({ ...base, policy: null, paymentPlan: 'upfront' }), {
    ok: true,
    payments: [{ installmentNo: 1, amount: 30000, label: 'Full payment', dueDate: today }],
  });
});

test('coursePolicy reads Course.metadata and treats anything odd as off', () => {
  assert.equal(coursePolicy({}), null);
  assert.equal(coursePolicy({ installmentPolicy: { ...P, allowCustom: false } }), null);
  assert.equal(coursePolicy({ installmentPolicy: { minDepositPct: 'x' } }), null);
  assert.deepEqual(coursePolicy({ installmentPolicy: P }), P);
});

test('summarizeEnrollmentPayments counts paid rows, or a confirmed upfront payment', () => {
  const rows = [
    { installmentNo: 1, amount: 5000, dueDate: today, status: 'paid' },
    { installmentNo: 2, amount: 12500, dueDate: new Date('2026-09-01'), status: 'pending' },
  ];
  const s = summarizeEnrollmentPayments({ amount: 5000, totalAmount: 30000, paymentStatus: 'succeeded' }, rows, today);
  assert.equal(s.amountPaid, 5000);
  assert.equal(s.remainingBalance, 25000);
  assert.equal(s.overdueAmount, 12500);
  assert.equal(summarizeEnrollmentPayments({ amount: 30000, totalAmount: 30000, paymentStatus: 'succeeded' }, []).remainingBalance, 0);
});
