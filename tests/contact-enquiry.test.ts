// Contact form: phone normalisation and the topic list the form and the notice share.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalisePhone } from '../src/lib/phone-countries';
import { ENQUIRY_TOPICS, MASKANI, POWER_SUITE, SERVICE_PILLARS, enquiryTopicLabel, productNameForServiceTag } from '../src/config/services';
import { PROJECTS } from '../prisma/seed/projects';
import fs from 'node:fs';
import path from 'node:path';

test('Kenyan numbers typed the usual ways all become +2547...', () => {
  for (const typed of ['0712 345 678', '712345678', '+254 712 345 678', '254712345678', '0112345678', '00254712345678']) {
    const got = normalisePhone(typed);
    assert.ok(got === '+254712345678' || got === '+254112345678', `${typed} gave ${got}`);
  }
});

test('other countries keep their code and are checked against that country', () => {
  assert.equal(normalisePhone('+255 712 345 678'), '+255712345678');
  assert.equal(normalisePhone('+256 772 345 678'), '+256772345678');
  assert.equal(normalisePhone('+255 12'), null);
});

test('rubbish is rejected so the WhatsApp acknowledgement is never sent to a bad number', () => {
  for (const typed of ['', 'call me', '12345', '+254 512 345 678', '0812345678']) {
    assert.equal(normalisePhone(typed), null, typed);
  }
});

test('every topic has a readable label and unknown values fall back to themselves', () => {
  const values = ENQUIRY_TOPICS.map((t) => t.value);
  assert.equal(new Set(values).size, values.length, 'topic values are unique');
  assert.equal(ENQUIRY_TOPICS.length, POWER_SUITE.length + 1 + SERVICE_PILLARS.length + 1);
  assert.equal(enquiryTopicLabel('pos'), 'POS System');
  assert.equal(enquiryTopicLabel(MASKANI.id), 'Maskani');
  assert.equal(enquiryTopicLabel('Attachment Application'), 'Attachment Application');
  assert.equal(enquiryTopicLabel(undefined), undefined);
});

test('the Power Suite matches the 14-product roll-up and prices map to one product each', () => {
  assert.equal(POWER_SUITE.length, 14);
  const tags = POWER_SUITE.map((p) => p.serviceTag).filter(Boolean);
  assert.equal(new Set(tags).size, tags.length, 'a serviceTag prices one product');
  assert.equal(productNameForServiceTag('hospital'), 'Codevertex Afya');
});

test('every seeded project photo exists on disk', () => {
  for (const p of PROJECTS) {
    assert.match(p.slug, /^[a-z0-9-]+$/);
    for (const photo of p.photos) {
      const file = path.join(__dirname, '..', 'prisma', 'seed', 'project-photos', p.slug, photo.file);
      assert.ok(fs.existsSync(file), `${p.slug}/${photo.file} is missing`);
    }
  }
});
