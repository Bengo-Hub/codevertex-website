import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captureAttribution, getAttribution, trackLead } from '../src/lib/attribution';

// A minimal browser: localStorage and the dataLayer the Google tag reads.
const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  location: { search: '' },
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  },
};



test('keeps the click ids and UTM tags of the landing URL', () => {
  captureAttribution('?gclid=abc123&utm_source=google&utm_medium=cpc&utm_campaign=pos&other=x');
  assert.deepEqual(getAttribution(), { gclid: 'abc123', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'pos' });
});

test('a page without tags keeps the earlier ad click', () => {
  captureAttribution('?page=2');
  assert.equal(getAttribution().gclid, 'abc123');
});

test('a new ad click replaces the old one', () => {
  captureAttribution('?fbclid=meta1');
  assert.deepEqual(getAttribution(), { fbclid: 'meta1' });
});

test('attribution older than 90 days is dropped', () => {
  store.set('cv_attribution', JSON.stringify({ at: Date.now() - 91 * 24 * 3600 * 1000, values: { gclid: 'old' } }));
  assert.deepEqual(getAttribution(), {});
});

test('a successful enquiry pushes generate_lead for Google Tag Manager', () => {
  trackLead({ form: 'contact', service: 'pos' });
  const dl = (globalThis as unknown as { window: { dataLayer: Array<Record<string, string>> } }).window.dataLayer;
  assert.deepEqual(dl.at(-1), { event: 'generate_lead', lead_form: 'contact', lead_service: 'pos' });
});
