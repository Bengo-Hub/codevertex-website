import { SUBSCRIPTIONS_API_URL } from '@/lib/constants';

// Server-only fetch from subscriptions-api's real, public plan catalog — never called
// from the browser (subscriptions-api's CORS allowlist doesn't include this site's own
// domain, so this must stay a server-side fetch, not a client one).

interface RawPlan {
  planCode: string;
  name: string;
  description: string;
  billingCycle: string;
  basePrice: number;
  setupFee: number;
  currency: string;
  isActive: boolean;
  isPublic: boolean;
  serviceTag: string;
  freeTrialDays: number;
}

export interface ProductPricing {
  key: string;
  name: string;
  fromPrice: number;
  currency: string;
  description: string;
  freeTrialDays: number;
}

// Friendly display name per serviceTag — falls back to a title-cased version of the tag.
const PRODUCT_NAMES: Record<string, string> = {
  erp: 'ERP Suite',
  pos: 'POS System',
  inventory: 'Inventory',
  isp_billing: 'ISP Billing',
  marketflow: 'MarketFlow + Vera AI',
  logistics: 'Logistics',
  hospital: 'Codevertex Afya',
  library: 'Library Management',
  projects: 'Projects',
  etims_api: 'eTIMS API',
};

// Display order — flagship products first, matching /services' emphasis.
const PRODUCT_ORDER = ['erp', 'pos', 'inventory', 'isp_billing', 'marketflow', 'logistics', 'hospital', 'library', 'projects', 'etims_api'];

export async function fetchPublicPricing(): Promise<ProductPricing[]> {
  try {
    const res = await fetch(`${SUBSCRIPTIONS_API_URL}/api/v1/plans?active=true`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: RawPlan[] };
    const plans = (body.data ?? []).filter((p) => p.isPublic && p.isActive && p.billingCycle === 'MONTHLY');

    const cheapestByTag = new Map<string, RawPlan>();
    for (const plan of plans) {
      const current = cheapestByTag.get(plan.serviceTag);
      if (!current || plan.basePrice < current.basePrice) {
        cheapestByTag.set(plan.serviceTag, plan);
      }
    }

    const products: ProductPricing[] = Array.from(cheapestByTag.entries()).map(([tag, plan]) => ({
      key: tag,
      name: PRODUCT_NAMES[tag] ?? tag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      fromPrice: plan.basePrice,
      currency: plan.currency,
      description: plan.description,
      freeTrialDays: plan.freeTrialDays,
    }));

    products.sort((a, b) => {
      const ai = PRODUCT_ORDER.indexOf(a.key);
      const bi = PRODUCT_ORDER.indexOf(b.key);
      if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    return products;
  } catch {
    return [];
  }
}
