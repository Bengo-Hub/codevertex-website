// Server-only fetch from auth-api's public tenant marketplace listing — real, live
// Power Suite customers, not marketing copy. Never called from the browser.

import sharp from 'sharp';

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'https://sso.codevertexafrica.com';

interface RawMarketplaceTenant {
  slug: string;
  name: string;
  logo_url?: string;
  use_case?: string;
  use_cases?: string[];
  country?: string;
}

export interface ClientTenant {
  slug: string;
  name: string;
  logoUrl: string;
  useCase: string;
}

const USE_CASE_LABELS: Record<string, string> = {
  services: 'Professional Services',
  hospitality: 'Hospitality',
  logistics: 'Logistics',
  retail: 'Retail',
  library: 'Library & Education',
  pharmacy: 'Pharmacy',
  healthcare: 'Healthcare',
  isp: 'ISP',
  fbo: 'Food Business',
};

function labelFor(useCase?: string): string {
  if (!useCase) return 'Power Suite customer';
  return USE_CASE_LABELS[useCase.toLowerCase()] ?? useCase.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// A handful of tenants have their logo stored as an inline base64 data URI rather than
// a hosted URL, and some of those are full-resolution photos rather than an actual
// logo asset (one was 780KB+) — embedding that directly would bloat this page for every
// visitor. Rather than drop those tenants from the showcase, oversized inline logos are
// resized down to something a logo tile actually needs.
const MAX_INLINE_LOGO_BYTES = 60_000;
const LOGO_MAX_DIMENSION = 160;

async function shrinkDataUri(dataUri: string): Promise<string | null> {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  try {
    const buffer = Buffer.from(match[2], 'base64');
    const resized = await sharp(buffer)
      .resize({ width: LOGO_MAX_DIMENSION, height: LOGO_MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .png({ quality: 80, compressionLevel: 9 })
      .toBuffer();
    return `data:image/png;base64,${resized.toString('base64')}`;
  } catch {
    return null;
  }
}

// Only real, branded customers belong in a public logo showcase — a tenant without a
// logo hasn't set up branding yet, so it's excluded rather than shown as a bare name.
export async function fetchShowcaseTenants(): Promise<ClientTenant[]> {
  try {
    // The raw listing can exceed Next's 2MB data-cache limit once inline logos are
    // included, so this fetch is deliberately never cached at the fetch level — the
    // page itself still revalidates hourly (see `revalidate` export on the homepage).
    const res = await fetch(`${AUTH_API_URL}/api/v1/tenants/marketplace?limit=100`, { cache: 'no-store' });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: RawMarketplaceTenant[] };

    const withLogos = (body.data ?? []).filter((t) => !!t.logo_url);

    const resolved = await Promise.all(
      withLogos.map(async (t) => {
        let logoUrl = t.logo_url!;
        if (logoUrl.length > MAX_INLINE_LOGO_BYTES && logoUrl.startsWith('data:')) {
          const shrunk = await shrinkDataUri(logoUrl);
          if (!shrunk) return null; // genuinely unreadable image — skip rather than ship it raw
          logoUrl = shrunk;
        }
        return {
          slug: t.slug,
          name: t.name,
          logoUrl,
          useCase: labelFor(t.use_case ?? t.use_cases?.[0]),
        };
      })
    );

    return resolved.filter((t): t is ClientTenant => t !== null);
  } catch {
    return [];
  }
}
