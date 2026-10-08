// Parent portal security primitives (no database needed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { signScopedToken, verifyScopedToken, keyedHash, signSessionPayload, verifySessionPayload } from '../src/lib/auth/session-crypto';
import { normalizeStudentId, maskEmail, maskPhone, clientIp } from '../src/lib/parent-access';
import { summarizeEnrollmentPayments } from '../src/lib/enrollment-helpers';
import { buildTreasuryPayUrl } from '../src/lib/treasury-pay';

const inAMinute = () => Math.floor(Date.now() / 1000) + 60;

test('scoped tokens round-trip and are bound to their purpose', async () => {
  const token = await signScopedToken('parent-portal', { sid: 'DGT-ABCD2345', exp: inAMinute() });
  assert.equal((await verifyScopedToken<{ sid: string; exp: number }>('parent-portal', token))?.sid, 'DGT-ABCD2345');
  assert.equal(await verifyScopedToken('other-purpose', token), null);
  assert.equal(await verifyScopedToken('parent-portal', token + 'x'), null);
  // A parent token must never be accepted as an admin/student cv_session.
  assert.equal(await verifySessionPayload(token), null);
});

test('scoped tokens expire, and session tokens are not parent tokens', async () => {
  const expired = await signScopedToken('parent-portal', { sid: 'DGT-ABCD2345', exp: Math.floor(Date.now() / 1000) - 1 });
  assert.equal(await verifyScopedToken('parent-portal', expired), null);
  const session = await signSessionPayload({ userId: 'DGT-ABCD2345', role: 'parent', exp: inAMinute() });
  assert.equal(await verifyScopedToken('parent-portal', session), null);
});

test('keyed hash is deterministic and purpose-separated', async () => {
  assert.equal(await keyedHash('parent-code', 'x:123456'), await keyedHash('parent-code', 'x:123456'));
  assert.notEqual(await keyedHash('parent-code', 'x:123456'), await keyedHash('parent-ip', 'x:123456'));
});

test('student id normalisation and masking', () => {
  assert.equal(normalizeStudentId(' dgt-ab12cd34 '), 'DGT-AB12CD34');
  assert.equal(normalizeStudentId('DGT-123'), null);
  assert.equal(normalizeStudentId(42), null);
  assert.equal(maskEmail('jane.doe@gmail.com'), 'j***@gmail.com');
  assert.equal(maskPhone('+254 700 111 222'), '***222');
});

test('client ip ignores the client-controlled left-most X-Forwarded-For hop', () => {
  const spoofed = new NextRequest('http://localhost/', { headers: { 'x-forwarded-for': '1.1.1.1, 10.0.0.9' } });
  assert.equal(clientIp(spoofed), '10.0.0.9');
  const real = new NextRequest('http://localhost/', { headers: { 'x-real-ip': '41.90.1.2', 'x-forwarded-for': '1.1.1.1' } });
  assert.equal(clientIp(real), '41.90.1.2');
});

test('payment summary: installments, upfront and arrears', () => {
  const now = new Date('2026-10-08T12:00:00Z');
  const inst = [
    { installmentNo: 1, amount: 9000, dueDate: new Date('2026-08-29'), status: 'paid' },
    { installmentNo: 2, amount: 6000, dueDate: new Date('2026-10-03'), status: 'pending' },
  ];
  const s = summarizeEnrollmentPayments({ amount: 9000, totalAmount: 15000, paymentStatus: 'succeeded' }, inst, now);
  assert.deepEqual([s.amountPaid, s.remainingBalance, s.overdueAmount, s.nextDue?.installmentNo], [9000, 6000, 6000, 2]);

  const upfront = summarizeEnrollmentPayments({ amount: 8000, totalAmount: 8000, paymentStatus: 'succeeded' }, [], now);
  assert.deepEqual([upfront.amountPaid, upfront.remainingBalance], [8000, 0]);

  const unpaid = summarizeEnrollmentPayments({ amount: 8000, totalAmount: null, paymentStatus: 'pending' }, [], now);
  assert.deepEqual([unpaid.totalAmount, unpaid.amountPaid, unpaid.remainingBalance], [8000, 0, 8000]);
});

test('treasury pay link carries the reference treasury-subscriber parses', () => {
  const url = new URL(buildTreasuryPayUrl({ amount: 6000, currency: 'KES', referenceId: 'DGT-1-DGT-DGT-AB12CD34', description: 'x', redirectUrl: 'https://codevertexafrica.com/digitika/parent' }));
  assert.equal(url.searchParams.get('amount'), '6000');
  assert.match(url.searchParams.get('reference_id')!, /^DGT-(\d+)-/);
  assert.equal(url.searchParams.get('reference_type'), 'digitika_enrollment');
});
