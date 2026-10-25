import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageIntro } from '@/components/site/PageIntro';
import { CTASection } from '@/components/home/CTASection';
import { formatCurrency } from '@/lib/utils';
import { fetchPublicPricing } from '@/lib/subscriptions';
import { MASKANI, POWER_SUITE } from '@/config/services';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Live monthly prices for the Codevertex Power Suite, straight from our billing system.',
};

// Live catalogue data: refetched hourly.
export const revalidate = 3600;

export default async function PricingPage() {
  const plans = await fetchPublicPricing();
  const priced = new Set(plans.map((p) => p.key));
  const quoteOnly = [...POWER_SUITE, MASKANI].filter((p) => !p.serviceTag || !priced.has(p.serviceTag));

  return (
    <>
      <PageIntro
        title="Pricing"
        lead="Each product is priced on its own, so you pay only for what you use. These prices come straight from our billing system and are the cheapest monthly plan for each product."
      />

      <section className="bg-background px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="max-w-5xl mx-auto">
          {plans.length > 0 ? (
            <ul className="divide-y divide-border border-y border-border">
              {plans.map((p) => (
                <li key={p.key} className="grid gap-4 py-8 sm:grid-cols-12 sm:items-start">
                  <div className="sm:col-span-4">
                    <h2 className="font-display text-xl font-bold text-foreground">{p.name}</h2>
                    {p.freeTrialDays > 0 && <p className="text-sm text-muted-foreground mt-1">{p.freeTrialDays}-day free trial</p>}
                  </div>
                  <p className="sm:col-span-5 text-muted-foreground leading-relaxed">{p.description}</p>
                  <div className="sm:col-span-3 sm:text-right">
                    <p className="text-sm text-muted-foreground">From</p>
                    <p className="font-display text-2xl font-bold text-foreground">{formatCurrency(p.fromPrice, p.currency)}</p>
                    <p className="text-sm text-muted-foreground">a month</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-border p-8">
              <p className="font-semibold text-foreground">Prices could not be loaded just now.</p>
              <p className="text-muted-foreground mt-1">Call or message us and we will send you a quote today.</p>
              <Button className="mt-5" asChild><Link href="/contact">Ask for a quote</Link></Button>
            </div>
          )}

          {quoteOnly.length > 0 && (
            <div className="mt-14">
              <h2 className="font-display text-2xl font-bold text-foreground">Priced on request</h2>
              <p className="mt-2 text-muted-foreground max-w-2xl">
                These depend on your number of users, branches or sites. Tell us your setup and we will quote within one business day.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {quoteOnly.map((p) => (
                  <li key={p.id}>
                    <Link href={`/contact?service=${p.id}`} className="inline-block rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary">
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-14 text-sm text-muted-foreground">
            Prices are in Kenya shillings and VAT may apply. Digitika Academy courses are priced separately:{' '}
            <Link href="/digitika#courses" className="text-primary font-semibold hover:underline underline-offset-4">see course fees</Link>.
          </p>
        </div>
      </section>

      <CTASection />
    </>
  );
}
