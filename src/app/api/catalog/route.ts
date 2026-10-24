import { NextResponse } from 'next/server';
import { POWER_SUITE, SERVICE_PILLARS } from '@/config/services';

// Public, read-only catalogue of Codevertex products and service lines, from the same config the
// website renders. Other apps (MarketFlow onboarding) read it instead of keeping their own copy;
// courses have their own endpoint at /api/courses.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://codevertexafrica.com').replace(/\/$/, '');

// Links leave this site, so relative ones are made absolute.
const absolute = (href?: string) => (!href ? undefined : href.startsWith('http') ? href : `${SITE_URL}${href}`);

export function GET() {
  const products = POWER_SUITE.filter((p) => p.status !== 'offline').map((p) => ({
    id: p.id,
    name: p.name,
    tag: p.tag,
    description: p.description,
    url: p.url,
    status: p.status,
    highlights: p.highlights,
  }));
  const services = SERVICE_PILLARS.map((s) => ({
    id: s.id,
    name: s.name,
    tagline: s.tagline,
    description: s.description,
    features: s.features,
    url: absolute(s.cta?.href),
  }));
  return NextResponse.json(
    { products, services },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
  );
}
