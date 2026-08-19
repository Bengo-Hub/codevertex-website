// Server-only fetch from auth-api's public tenant marketplace listing — real, live
// Power Suite customers, not marketing copy. Never called from the browser.

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
// logo asset (one is 780KB+) — embedding that directly would bloat this page for every
// visitor. A properly-sized logo is a few KB at most, so anything past this is almost
// certainly not a prepared logo and is excluded rather than shipped as-is.
const MAX_INLINE_LOGO_BYTES = 60_000;

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

    return (body.data ?? [])
      .filter((t) => !!t.logo_url && t.logo_url.length <= MAX_INLINE_LOGO_BYTES)
      .map((t) => ({
        slug: t.slug,
        name: t.name,
        logoUrl: t.logo_url!,
        useCase: labelFor(t.use_case ?? t.use_cases?.[0]),
      }));
  } catch {
    return [];
  }
}
