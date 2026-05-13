import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Pricing', description: 'Simple transparent pricing for the Codevertex Power Suite.' };

const PLANS = [
  {
    name: 'Starter', monthly: 4999, annual: 3999, color: 'text-primary',
    features: ['1 SaaS Product', 'Up to 5 users', 'Email & chat support', 'Basic analytics', 'Codevertex SSO'],
    cta: 'Get started',
  },
  {
    name: 'Growth', monthly: 14999, annual: 11999, highlight: true, color: 'text-primary',
    features: ['Up to 3 SaaS Products', 'Up to 25 users', 'Priority support', 'Advanced analytics', 'Custom domain', 'API access', 'Onboarding session'],
    cta: 'Start free trial',
  },
  {
    name: 'Enterprise', monthly: null, annual: null, color: 'text-primary',
    features: ['All SaaS Products', 'Unlimited users', 'Dedicated account manager', 'Custom AI integrations', 'SLA guarantee', 'On-premise option', 'Custom training'],
    cta: 'Contact sales',
  },
];

export default function PricingPage() {
  return (
    <div className="pt-16">
      <section className="bg-foreground pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Pricing</p>
          <h1 className="text-5xl sm:text-6xl font-black text-white dark:text-foreground tracking-tight leading-[1.05] mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-white/70 dark:text-muted-foreground text-lg max-w-xl mx-auto">Start free. Scale as you grow. No hidden fees.</p>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={cn(
                'relative rounded-2xl border p-8 flex flex-col',
                plan.highlight
                  ? 'border-primary shadow-primary-lg bg-card scale-[1.02]'
                  : 'border-border bg-card'
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-black text-foreground mb-2">{plan.name}</h3>
              <div className="mb-6">
                {plan.monthly !== null
                  ? <><span className="text-4xl font-black text-primary">KES {plan.monthly.toLocaleString()}</span><span className="text-sm text-muted-foreground">/mo</span></>
                  : <span className="text-3xl font-black text-primary">Custom</span>}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant={plan.highlight ? 'default' : 'outline'} asChild>
                <Link href={plan.name === 'Enterprise' ? '/contact' : '/contact'}>{plan.cta} →</Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8">
          All prices in KES. VAT may apply. Digitika Academy courses are priced separately —{' '}
          <Link href="/digitika" className="text-primary font-semibold hover:underline">view course fees →</Link>
        </p>
      </section>
    </div>
  );
}
