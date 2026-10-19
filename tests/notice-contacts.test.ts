// Who a Digitika notification reaches, and how due dates read in reminders.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accessCodeContacts, noticePeople, type StudentContacts } from '../src/lib/notice-contacts';
import { daysUntil } from '../src/lib/installments';
import { placeholderEmail } from '../src/lib/learner-rules';

const child: StudentContacts = {
  id: 'DGT-ABCD2345', fullName: 'Clara Jessica', email: placeholderEmail('DGT-ABCD2345'), phone: '',
  guardianName: 'Sarah Digo', guardianEmail: 'Sarah@Example.com', guardianPhone: '+254708244385',
};

test('a child without an email is reached through the guardian, never on a placeholder', () => {
  const p = noticePeople(child);
  assert.equal(p.studentEmail, '');
  assert.equal(p.studentPhone, '');
  assert.equal(p.guardianEmail, 'sarah@example.com');
  assert.equal(p.guardianPhone, '+254708244385');
  assert.equal(p.studentId, 'DGT-ABCD2345');
});

test('an adult keeps their own contacts and has no guardian', () => {
  const p = noticePeople({ ...child, email: 'adult@example.com', phone: ' +254712345678 ', guardianName: null, guardianEmail: null, guardianPhone: null });
  assert.equal(p.studentEmail, 'adult@example.com');
  assert.equal(p.studentPhone, '+254712345678');
  assert.equal(p.guardianEmail, '');
});

test('the parent portal code goes to the guardian when there is one, else to the learner', () => {
  assert.deepEqual(accessCodeContacts(child), { email: 'sarah@example.com', phone: '+254708244385', who: 'guardian' });
  const adult = { ...child, email: 'adult@example.com', phone: '+254712345678', guardianName: null, guardianEmail: null, guardianPhone: null };
  assert.deepEqual(accessCodeContacts(adult), { email: 'adult@example.com', phone: '+254712345678', who: 'student' });
  const nobody = { ...child, guardianName: null, guardianEmail: null, guardianPhone: null };
  assert.deepEqual(accessCodeContacts(nobody), { email: '', phone: '', who: 'student' });
});

test('days until a due date: today is 0, tomorrow 1, yesterday -1', () => {
  const now = new Date('2026-11-15T08:00:00Z');
  const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
  assert.equal(daysUntil(day('2026-11-15'), now), 0);
  assert.equal(Object.is(daysUntil(day('2026-11-15'), now), -0), false);
  assert.equal(daysUntil(day('2026-11-16'), now), 1);
  assert.equal(daysUntil(day('2026-11-18'), now), 3);
  assert.equal(daysUntil(day('2026-11-14'), now), -1);
  assert.equal(daysUntil(day('2026-11-10'), now), -5);
});
