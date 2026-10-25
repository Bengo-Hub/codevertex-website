import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { MASKANI, POWER_SUITE, SERVICE_PILLARS, type PowerSuiteProduct } from '@/config/services';
import { Button } from '@/components/ui/button';
import { PageIntro } from '@/components/site/PageIntro';
import { CTASection } from '@/components/home/CTASection';
import { fetchPublicPricing, type ProductPricing } from '@/lib/subscriptions';
import { formatFromPrice, priceFor } from '@/components/home/PowerSuiteSection';
import { SSO_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Products and services',
  description:
    'The Codevertex Power Suite (ERP, Books, POS, Ordering, Inventory, Logistics, TruLoad, ISP Billing, Afya, Library and more) and the software, hosting, security, hardware and training services around it.',
};

// Prices come from subscriptions-api; refreshed hourly.
export const revalidate = 3600;

function ProductRow({ product, pricing }: { product: PowerSuiteProduct; pricing: ProductPricing[] }) {
  const price = formatFromPrice(priceFor(product, pricing));
  return (
    <li id={product.id} className="scroll-mt-28 grid gap-6 py-10 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <product.icon className="h-6 w-6 text-primary mb-3" aria-hidden />
        <h3 className="font-display text-2xl font-bold text-foreground">{product.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">For {product.tag.toLowerCase()}</p>
        {price && <p className="mt-3 text-sm font-semibold text-foreground">{price}</p>}
      </div>
      <div className="lg:col-span-5">
        <p className="text-foreground/85 leading-relaxed">{product.description}</p>
        <ul className="mt-4 space-y-2">
          {product.highlights.map((h) => (
            <li key={h} className="flex gap-2.5 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden /> {h}
            </li>
          ))}
        </ul>
      </div>
      <div className="lg:col-span-3 flex flex-wrap content-start gap-2 lg:justify-end">
        <Button variant="outline" size="sm" asChild>
          <a href={product.url} target="_blank" rel="noreferrer">Open {product.name}</a>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/contact?service=${product.id}`}>Ask about it</Link>
        </Button>
      </div>
      {product.screenshot && (
        <figure className="lg:col-start-5 lg:col-span-8">
          <div className="relative aspect-16/9 overflow-hidden rounded-md bg-muted">
            <Image src={product.screenshot.src} alt={product.screenshot.alt} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
          </div>
        </figure>
      )}
    </li>
  );
}

export default async function ServicesPage() {
  const pricing = await fetchPublicPricing();

  return (
    <>
      <PageIntro
        title="Products and services"
        lead={`${POWER_SUITE.length} products that share one sign-in, plus the people to build, install and support what your business needs around them.`}
      >
        <div className="flex flex-wrap gap-3">
          <Button size="lg" asChild><Link href="/contact">Book a demo</Link></Button>
          <Button size="lg" variant="outline" asChild>
            <a href={SSO_URL} target="_blank" rel="noreferrer">Sign in to your account</a>
          </Button>
        </div>
      </PageIntro>

      <section aria-labelledby="products-heading" className="bg-background px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto">
          <h2 id="products-heading" className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">The Power Suite</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            One account, one set of users and one bill across every product. Prices shown are the cheapest published monthly
            plan; see <Link href="/pricing" className="text-primary hover:underline underline-offset-4">pricing</Link> for every plan.
          </p>

          <nav aria-label="Products" className="mt-8 flex flex-wrap gap-2">
            {[...POWER_SUITE, MASKANI].map((p) => (
              <a key={p.id} href={`#${p.id}`} className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30">
                {p.name}
              </a>
            ))}
          </nav>

          <ul className="mt-6 divide-y divide-border border-y border-border">
            {POWER_SUITE.map((p) => <ProductRow key={p.id} product={p} pricing={pricing} />)}
          </ul>

          <div className="mt-12 rounded-lg bg-night text-night-foreground p-8 lg:p-10">
            <ul><ProductRowDark product={MASKANI} /></ul>
          </div>
        </div>
      </section>

      <section id="services" aria-labelledby="services-heading" className="scroll-mt-20 bg-secondary px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <h2 id="services-heading" className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Services</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            {SERVICE_PILLARS.length} kinds of work we take on for clients, from a single integration to a full system.
          </p>
          <ul className="mt-10 grid gap-x-10 gap-y-14 md:grid-cols-2">
            {SERVICE_PILLARS.map((s) => (
              <li key={s.id} id={`service-${s.id}`} className="scroll-mt-28">
                {s.photo && (
                  <div className="relative aspect-16/9 overflow-hidden rounded-md bg-muted mb-5">
                    <Image src={s.photo.src} alt={s.photo.alt} fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
                  </div>
                )}
                <s.icon className="h-5 w-5 text-primary mb-3" aria-hidden />
                <h3 className="font-display text-2xl font-bold text-foreground">{s.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{s.tagline}</p>
                <p className="mt-3 text-foreground/85 leading-relaxed">{s.description}</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {s.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden /> {f}
                    </li>
                  ))}
                </ul>
                {s.cta && (
                  <Link href={s.cta.href} className="mt-5 inline-block font-semibold text-primary hover:underline underline-offset-4">{s.cta.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CTASection />
    </>
  );
}

function ProductRowDark({ product }: { product: PowerSuiteProduct }) {
  return (
    <li id={product.id} className="scroll-mt-28 grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <product.icon className="h-6 w-6 text-gold mb-3" aria-hidden />
        <h3 className="font-display text-2xl font-bold">{product.name}</h3>
        <p className="text-sm text-night-foreground/70 mt-1">For {product.tag.toLowerCase()}. Sold on its own.</p>
      </div>
      <div className="lg:col-span-5">
        <p className="text-night-foreground/85 leading-relaxed">{product.description}</p>
        <ul className="mt-4 space-y-2">
          {product.highlights.map((h) => (
            <li key={h} className="flex gap-2.5 text-sm text-night-foreground/75">
              <Check className="h-4 w-4 text-gold shrink-0 mt-0.5" aria-hidden /> {h}
            </li>
          ))}
        </ul>
      </div>
      <div className="lg:col-span-3 flex flex-wrap content-start gap-2 lg:justify-end">
        <Button variant="gold" size="sm" asChild>
          <a href={product.url} target="_blank" rel="noreferrer">Visit {product.name}</a>
        </Button>
        <Button variant="outline-light" size="sm" asChild>
          <Link href={`/contact?service=${product.id}`}>Ask about it</Link>
        </Button>
      </div>
    </li>
  );
}
