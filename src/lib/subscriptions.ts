import { SUBSCRIPTIONS_API_URL } from '@/lib/constants';
import { MASKANI, POWER_SUITE, productNameForServiceTag } from '@/config/services';

// Server-only fetch from subscriptions-api's public plan catalogue. It is never called from the
// browser: subscriptions-api's CORS allowlist does not include this site, so it stays server side.

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

// Display names come from the product config so a product is named the same everywhere.
// Tags with no product there (an API-only plan) fall back to a title-cased tag.
const EXTRA_NAMES: Record<string, string> = { etims_api: 'eTIMS API' };

// Display order follows the product list on /services, extras last.
const PRODUCT_ORDER = [...POWER_SUITE, MASKANI].map((p) => p.serviceTag).filter(Boolean) as string[];

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
      name: productNameForServiceTag(tag) ?? EXTRA_NAMES[tag] ?? tag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
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
