import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { MASKANI, POWER_SUITE, type PowerSuiteProduct } from '@/config/services';
import type { ProductPricing } from '@/lib/subscriptions';
import { Button } from '@/components/ui/button';

export function formatFromPrice(p?: ProductPricing) {
  if (!p || p.fromPrice <= 0) return null;
  return `From ${p.currency} ${p.fromPrice.toLocaleString('en-KE')} a month`;
}

export function priceFor(product: PowerSuiteProduct, pricing: ProductPricing[]) {
  return product.serviceTag ? pricing.find((p) => p.key === product.serviceTag) : undefined;
}

function NewTag() {
  return <span className="rounded-sm bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-accent-foreground">New</span>;
}

/** The 14 Power Suite products as one scannable list, with live "from" prices where a plan exists. */
export function PowerSuiteSection({ pricing }: { pricing: ProductPricing[] }) {
  return (
    <section aria-labelledby="suite-heading" className="bg-background px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end mb-12">
          <h2 id="suite-heading" className="lg:col-span-7 font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
            {POWER_SUITE.length} products. One sign-in.
          </h2>
          <p className="lg:col-span-5 text-muted-foreground text-lg leading-relaxed">
            Every product shares one account, one set of users and one bill. Start with the one you need and switch
            the others on as you grow.
          </p>
        </div>

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-border">
          {POWER_SUITE.map((p) => {
            const price = formatFromPrice(priceFor(p, pricing));
            return (
              <li key={p.id} className="border-b border-r border-border">
                <a href={p.url} target="_blank" rel="noreferrer" className="group flex h-full flex-col gap-3 p-6 hover:bg-secondary focus-visible:bg-secondary">
                  <div className="flex items-center justify-between gap-3">
                    <p.icon className="h-5 w-5 text-primary" aria-hidden />
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
                  </div>
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold text-foreground">
                      {p.name} {p.isNew && <NewTag />}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{p.summary}</p>
                  </div>
                  <p className="mt-auto pt-2 text-xs text-muted-foreground">
                    {p.tag}
                    {price && <span className="block mt-0.5 font-semibold text-foreground">{price}</span>}
                  </p>
                </a>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 grid gap-6 rounded-lg bg-night text-night-foreground p-8 lg:p-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8">
            <p className="flex items-center gap-2 text-sm font-semibold text-gold mb-2">
              <MASKANI.icon className="h-4 w-4" aria-hidden /> {MASKANI.name}
            </p>
            <h3 className="font-display text-2xl sm:text-3xl font-bold">{MASKANI.summary}</h3>
            <p className="mt-3 text-night-foreground/75 max-w-2xl">{MASKANI.description}</p>
          </div>
          <div className="lg:col-span-4 flex flex-wrap gap-3 lg:justify-end">
            <Button variant="gold" asChild>
              <a href={MASKANI.url} target="_blank" rel="noreferrer">Visit Maskani</a>
            </Button>
            <Button variant="outline-light" asChild>
              <Link href="/contact?service=maskani">Ask about Maskani</Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild><Link href="/services">Compare the products</Link></Button>
          <Button variant="outline" asChild><Link href="/pricing">See prices</Link></Button>
        </div>
      </div>
    </section>
  );
}
