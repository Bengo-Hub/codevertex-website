import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { MASKANI, POWER_SUITE, type PowerSuiteProduct } from '@/config/services';
import type { ProductPricing } from '@/lib/subscriptions';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/site/Reveal';
import { ProductShowcase, type ShowcaseProduct } from './ProductShowcase';

export function formatFromPrice(p?: ProductPricing) {
  if (!p || p.fromPrice <= 0) return null;
  return `From ${p.currency} ${p.fromPrice.toLocaleString('en-KE')} a month`;
}

export function priceFor(product: PowerSuiteProduct, pricing: ProductPricing[]) {
  return product.serviceTag ? pricing.find((p) => p.key === product.serviceTag) : undefined;
}

/** The core products with real screens, then the rest of the suite, then Maskani. */
export function PowerSuiteSection({ pricing }: { pricing: ProductPricing[] }) {
  const core: ShowcaseProduct[] = POWER_SUITE.filter((p) => p.core && p.screenshot).map((p) => ({
    id: p.id,
    name: p.name,
    summary: p.summary,
    description: p.description,
    highlights: p.highlights,
    url: p.url,
    price: formatFromPrice(priceFor(p, pricing)),
    screenshot: p.screenshot!,
  }));
  const rest = POWER_SUITE.filter((p) => !p.core);

  return (
    <section id="products" aria-labelledby="suite-heading" className="scroll-mt-20 bg-background px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto">
        <Reveal className="grid gap-4 lg:grid-cols-12 lg:items-end mb-10">
          <div className="lg:col-span-7">
            <p className="text-sm font-semibold text-primary">The Power Suite</p>
            <h2 id="suite-heading" className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
              {POWER_SUITE.length} products. One sign-in.
            </h2>
          </div>
          <p className="lg:col-span-5 text-muted-foreground text-lg leading-relaxed">
            One account, one set of users and one bill. Start with what you need today and switch on the rest as you
            grow. These are the real screens.
          </p>
        </Reveal>

        <Reveal className="rounded-4xl bg-mist p-4 sm:p-6 lg:p-8">
          <ProductShowcase products={core} />
        </Reveal>

        <Reveal className="mt-14">
          <h3 className="font-display text-2xl font-bold text-foreground">Also in the suite</h3>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {rest.map((p) => {
              const price = formatFromPrice(priceFor(p, pricing));
              return (
                <li key={p.id}>
                  <Link href={`/services#${p.id}`} className="group flex h-full gap-3 rounded-2xl border border-border bg-background p-4 shadow-soft transition-transform duration-300 hover:-translate-y-0.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist">
                      <p.icon className="h-5 w-5 text-primary" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 font-semibold text-foreground">
                        {p.name}
                        {p.isNew && <span className="rounded-full bg-accent px-1.5 py-px text-[11px] font-semibold text-accent-foreground">New</span>}
                      </span>
                      <span className="block text-sm text-muted-foreground leading-snug mt-0.5">{p.summary}</span>
                      {price && <span className="block text-xs font-semibold text-foreground mt-1.5">{price}</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal className="mt-10 relative overflow-hidden rounded-4xl bg-night text-night-foreground p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <p className="flex items-center gap-2 text-sm font-semibold text-gold">
                <MASKANI.icon className="h-4 w-4" aria-hidden /> {MASKANI.name}, sold on its own
              </p>
              <h3 className="mt-2 font-display text-2xl sm:text-3xl font-bold">{MASKANI.summary}</h3>
              <p className="mt-3 text-night-foreground/75 max-w-2xl">{MASKANI.description}</p>
            </div>
            <div className="lg:col-span-4 flex flex-wrap gap-3 lg:justify-end">
              <Button variant="gold" className="rounded-full" asChild>
                <a href={MASKANI.url} target="_blank" rel="noreferrer">Visit Maskani <ArrowUpRight className="h-4 w-4" aria-hidden /></a>
              </Button>
              <Button variant="outline-light" className="rounded-full" asChild>
                <Link href="/contact?service=maskani">Ask about it</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
