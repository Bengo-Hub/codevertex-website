// Job, attachment and service-offer enquiries are not leads (owner, 2026-11-24).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyEnquiry, ENQUIRY_KEYWORDS } from '../src/config/enquiry-classification';

test('the attachment form is always an attachment application', () => {
  assert.equal(classifyEnquiry({ form: 'attachment', message: 'Anything at all' }), 'attachment');
});

test('real messages from the audit are classified as the owner ruled', () => {
  assert.equal(classifyEnquiry({ form: 'contact', service: 'other', message: 'Am a student at The Eldoret National Polytechnic ,am inquiring for an opportunity for industrial attachment in your organization.' }), 'attachment');
  assert.equal(classifyEnquiry({ form: 'website', service: 'Attachment Application', message: 'ATTACHMENT APPLICATION\nInstitution: Zetech University' }), 'attachment');
  assert.equal(classifyEnquiry({ form: 'website', service: 'Enterprise Software Development', message: 'I am interested in joining Codevertex Africa as a Software Engineer/Full-Stack Developer.' }), 'job');
  assert.equal(classifyEnquiry({ form: 'contact', service: 'projects', message: 'Hi Agency Owner, We’re a web development company from India with 12+ years of experience' }), 'service_offer');
});

test('customers stay leads', () => {
  assert.equal(classifyEnquiry({ form: 'contact', service: 'pos', message: 'I need to manage my mitumba business using this app' }), 'lead');
  assert.equal(classifyEnquiry({ form: 'website', service: 'Other', message: 'Web development' }), 'lead');
  assert.equal(classifyEnquiry({ form: 'contact', service: 'erp', message: 'I sent the attachment with our requirements, please quote.' }), 'lead');
});

test('the keyword lists are configuration', () => {
  const custom = { attachment: ['placement'], job: ['careers'], serviceOffer: ['partnership offer'] };
  assert.equal(classifyEnquiry({ message: 'Asking about a placement' }, custom), 'attachment');
  assert.equal(classifyEnquiry({ message: 'industrial attachment' }, custom), 'lead');
  assert.ok(ENQUIRY_KEYWORDS.job.length > 0);
});
