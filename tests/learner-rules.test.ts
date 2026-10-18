// Age and guardian rules shared by public checkout and the admin enrollment form.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageOn, ageProblem, getAgeRange, guardianProblem, isUnder18 } from '../src/lib/learner-rules';
import { isValidLocalPhone, toInternationalPhone, COUNTRY_CODES } from '../src/lib/phone-countries';

const ref = new Date(2026, 9, 18); // 18 Oct 2026

test('age counts whole years and respects the birthday', () => {
  assert.equal(ageOn('2016-10-18', ref), 10);
  assert.equal(ageOn('2016-10-19', ref), 9);
  assert.equal(ageOn('', ref), null);
  assert.equal(ageOn('not-a-date', ref), null);
});

test('under 18 is false without a date of birth and true on the 18th birthday eve', () => {
  assert.equal(isUnder18(undefined, ref), false);
  assert.equal(isUnder18('2008-10-19', ref), true);
  assert.equal(isUnder18('2008-10-18', ref), false);
});

test('audience text gives the accepted ages', () => {
  assert.deepEqual(getAgeRange('Digital Creativity (Age 6-10)'), { min: 6, max: 10 });
  assert.deepEqual(getAgeRange('Ages 11–14'), { min: 11, max: 14 });
  assert.deepEqual(getAgeRange('Adults and professionals'), { min: 16, max: 99 });
  assert.equal(getAgeRange('Anyone curious'), null);
  assert.equal(getAgeRange(null), null);
});

test('an age-limited course needs a date of birth inside the range', () => {
  assert.match(ageProblem(undefined, 'Age 6-10', ref), /date of birth is needed/);
  assert.match(ageProblem('2010-01-01', 'Age 6-10', ref), /Calculated age: 16/);
  assert.equal(ageProblem('2018-01-01', 'Age 6-10', ref), '');
  assert.equal(ageProblem(undefined, 'Anyone curious', ref), '');
});

test('a minor needs a guardian name and a valid email of their own', () => {
  assert.match(guardianProblem('kid@x.com', true, undefined), /parent or guardian's name/);
  assert.match(guardianProblem('kid@x.com', true, { name: 'Mary', email: 'nope' }), /valid email/);
  assert.match(guardianProblem('kid@x.com', true, { name: 'Mary', email: 'KID@x.com' }), /own email/);
  assert.equal(guardianProblem('kid@x.com', true, { name: 'Mary', email: 'mary@x.com' }), '');
});

test('an adult needs no guardian but one given still cannot reuse their email', () => {
  assert.equal(guardianProblem('a@x.com', false, undefined), '');
  assert.match(guardianProblem('a@x.com', false, { name: 'B', email: 'a@x.com' }), /own email/);
});

test('phones are validated per country and stored in international form', () => {
  const ke = COUNTRY_CODES[0];
  assert.equal(isValidLocalPhone(ke, '0712 345 678'), true);
  assert.equal(isValidLocalPhone(ke, '12345'), false);
  assert.equal(toInternationalPhone(ke, '0712 345 678'), '+254712345678');
});
