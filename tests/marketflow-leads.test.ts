// Leads and enquiries live in MarketFlow; the admin pages map its leads to their rows.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enquirySource, isLeadId, pagesOf, splitName, toAdminContact, toAdminLead, type MFLead } from '../src/lib/marketflow';

const base: MFLead = {
  id: '6f1e0b3a-6b0e-4c55-9a2f-3d5b7c1e8a90',
  email: 'amina@example.com',
  phone: '+254712345678',
  first_name: 'Amina',
  last_name: 'Wanjiru Otieno',
  source: 'website_attachment',
  status: 'new',
  score: 40,
  interest: 'Web development',
  metadata: { form: 'attachment', message: 'I am looking for an attachment place.', service: 'web', notice_sent_at: '2026-11-22T13:48:40.100Z', notes: 'Call Monday', preferred_time: 'Mornings' },
  created_at: '2026-11-22T13:48:40.100Z',
};

test('splitName keeps the first word as the first name', () => {
  assert.deepEqual(splitName('Amina Wanjiru Otieno'), { first_name: 'Amina', last_name: 'Wanjiru Otieno' });
  assert.deepEqual(splitName('Amina'), { first_name: 'Amina' });
  assert.deepEqual(splitName('  '), {});
});

test('a MarketFlow lead maps to the Leads page row', () => {
  const row = toAdminLead(base);
  assert.equal(row.name, 'Amina Wanjiru Otieno');
  assert.equal(row.topic, 'Web development');
  assert.equal(row.notes, 'Call Monday');
  assert.equal(row.preferredTime, 'Mornings');
  assert.equal(row.createdAt, base.created_at);
});

test('an enquiry maps to the Contacts page row with its form, message and notice time', () => {
  const row = toAdminContact(base);
  assert.equal(row.source, 'attachment');
  assert.equal(row.message, 'I am looking for an attachment place.');
  assert.equal(row.service, 'web');
  assert.equal(row.noticeSentAt, '2026-11-22T13:48:40.100Z');
  const bare = toAdminContact({ ...base, source: 'website_contact', metadata: {} });
  assert.equal(bare.source, 'contact');
  assert.equal(bare.message, 'Web development');
});

test('enquiry forms write their own sources; ids are MarketFlow UUIDs', () => {
  assert.equal(enquirySource('attachment'), 'website_attachment');
  assert.equal(enquirySource('contact'), 'website_contact');
  assert.ok(isLeadId(base.id));
  assert.ok(!isLeadId('12'));
  assert.equal(pagesOf(41, 20), 3);
  assert.equal(pagesOf(0, 20), 1);
});
