/**
 * Google tag (Google Tag Manager container) for Google Ads conversions and site analytics.
 * NEXT_PUBLIC_GOOGLE_TAG_ID overrides it; an empty value turns the tag off.
 */
export const GOOGLE_TAG_ID: string = (process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ?? 'GTM-NSN3HJ98').trim();
