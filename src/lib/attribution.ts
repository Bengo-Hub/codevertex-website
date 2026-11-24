/**
 * Ad attribution for enquiries (owner, 2026-11-24): the click ids and UTM tags a visitor landed
 * with are kept in this browser for 90 days (Google's click window) and sent with the enquiry, so
 * MarketFlow can report the lead back to Google Ads (metadata.gclid) and Meta or TikTok.
 * Browser only; every storage call is guarded because storage can be blocked.
 */

export const ATTRIBUTION_KEYS = [
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'ttclid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];
export type Attribution = Partial<Record<AttributionKey, string>>;

const STORAGE_KEY = 'cv_attribution';
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_LEN = 256;

interface Stored {
  at: number;
  values: Attribution;
}

function read(): Stored | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Stored;
    if (!s || typeof s.at !== 'number' || Date.now() - s.at > MAX_AGE_MS) return null;
    return s;
  } catch {
    return null;
  }
}

/** Reads the landing URL's click ids and UTM tags; a new ad click replaces the stored ones. */
export function captureAttribution(search: string = typeof window === 'undefined' ? '' : window.location.search): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(search);
  const found: Attribution = {};
  for (const k of ATTRIBUTION_KEYS) {
    const v = params.get(k)?.trim();
    if (v) found[k] = v.slice(0, MAX_LEN);
  }
  if (Object.keys(found).length === 0) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ at: Date.now(), values: found } satisfies Stored));
  } catch {
    // Storage blocked: the enquiry is still sent, only without attribution.
  }
}

/** The stored attribution, or {} when none (or older than 90 days). */
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return {};
  return read()?.values ?? {};
}

/** Tells Google Tag Manager that an enquiry went through (trigger: custom event "generate_lead"). */
export function trackLead(details: { form: string; service?: string }): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event: 'generate_lead', lead_form: details.form, lead_service: details.service || '' });
}
