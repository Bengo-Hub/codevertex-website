import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { fetchPublicPricing } from '@/lib/subscriptions';

export const metadata: Metadata = { title: 'Pricing', description: 'Real, live pricing for every product in the Codevertex Power Suite.' };

// Live catalog data, not static copy — refetch periodically rather than caching indefinitely.
export const revalidate = 3600;

export default async function PricingPage() {
  const products = await fetchPublicPricing();

  return (
    <div className="pt-20">
      <section className="bg-foreground pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Pricing</p>
          <h1 className="text-5xl sm:text-6xl font-black text-white dark:text-foreground tracking-tight leading-[1.05] mb-4">
            Pay for what you use
          </h1>
          <p className="text-white/70 dark:text-muted-foreground text-lg max-w-xl mx-auto">
            Each product in the Power Suite is priced on its own — pick what your business needs, skip what it doesn&apos;t.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-6xl mx-auto">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.key} className="rounded-2xl border border-border bg-card p-8 flex flex-col">
                  <h3 className="text-xl font-black text-foreground mb-2">{p.name}</h3>
                  <div className="mb-4">
                    <span className="text-xs text-muted-foreground block mb-1">From</span>
                    <span className="text-4xl font-black text-primary">{formatCurrency(p.fromPrice, p.currency)}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed mb-6 flex-1">{p.description}</p>
                  {p.freeTrialDays > 0 && (
                    <p className="text-xs text-muted-foreground mb-4">{p.freeTrialDays}-day free trial</p>
                  )}
                  <Button variant="outline" asChild>
                    <Link href="/contact">Get a quote <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl border border-border bg-card">
              <p className="text-foreground font-semibold mb-2">Pricing is loading</p>
              <p className="text-sm text-muted-foreground mb-6">Talk to us directly for a quote tailored to your business.</p>
              <Button asChild>
                <Link href="/contact">Contact sales</Link>
              </Button>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-10">
            Prices shown are entry-level tiers per product — most businesses combine a few. All prices in KES, VAT may apply.
            Digitika Academy courses are priced separately —{' '}
            <Link href="/digitika" className="text-primary font-semibold hover:underline">view course fees →</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
