import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Check } from 'lucide-react';
import { GENERAL_DOCS, MASKANI, POWER_SUITE, SERVICE_PILLARS, type PowerSuiteProduct } from '@/config/services';
import { Button } from '@/components/ui/button';
import { PageIntro } from '@/components/site/PageIntro';
import { Reveal } from '@/components/site/Reveal';
import { ServiceCards } from '@/components/site/ServiceCards';
import { ProviderLogos } from '@/components/site/ProviderLogos';
import { CTASection } from '@/components/home/CTASection';
import { fetchPublicPricing, type ProductPricing } from '@/lib/subscriptions';
import { formatFromPrice, priceFor } from '@/components/home/PowerSuiteSection';
import { docsUrl, SSO_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Products and services',
  description:
    'The Codevertex Power Suite (POS, Books and Treasury, ERP, Inventory, Ordering, Logistics, TruLoad, Notifications, MarketFlow and more) and the software, hosting, security, hardware and training services around it.',
};

// Prices come from subscriptions-api; refreshed hourly.
export const revalidate = 3600;

function GuideLink({ product, className }: { product: PowerSuiteProduct; className?: string }) {
  return (
    <a href={docsUrl(product.docs ?? GENERAL_DOCS.start)} target="_blank" rel="noreferrer" className={className}>
      <BookOpen className="h-4 w-4" aria-hidden /> {product.docs ? 'Read the user guide' : 'Getting started guide'}
    </a>
  );
}

/** A core product: its scene beside the details, alternating sides down the page. */
function CoreProduct({ product, pricing, flip }: { product: PowerSuiteProduct; pricing: ProductPricing[]; flip: boolean }) {
  const price = formatFromPrice(priceFor(product, pricing));
  return (
    <li id={product.id} className="scroll-mt-28">
      <Reveal className="grid gap-8 lg:grid-cols-12 lg:items-center">
        {product.screenshot && (
          <div className={`lg:col-span-7 ${flip ? 'lg:order-2' : ''}`}>
            <div className="glass rounded-4xl p-2 shadow-lift">
              <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-night">
                <Image src={product.screenshot.src} alt={product.screenshot.alt} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
              </div>
            </div>
            {product.screenshot.credit && <p className="mt-2 text-xs text-muted-foreground">{product.screenshot.credit}</p>}
          </div>
        )}
        <div className="lg:col-span-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mist"><product.icon className="h-4 w-4" aria-hidden /></span>
            {product.tag}
          </p>
          <h3 className="mt-3 font-display text-3xl font-bold text-foreground">{product.name}</h3>
          <p className="mt-3 text-foreground/85 leading-relaxed">{product.description}</p>
          <ul className="mt-5 space-y-2">
            {product.highlights.map((h) => (
              <li key={h} className="flex gap-2.5 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden /> {h}
              </li>
            ))}
          </ul>
          {price && <p className="mt-5 inline-flex rounded-full bg-mist px-3 py-1 text-sm font-semibold text-foreground">{price}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button className="rounded-full" asChild><Link href={`/contact?service=${product.id}`}>Ask for a demo</Link></Button>
            <Button variant="outline" className="rounded-full" asChild>
              <a href={product.url} target="_blank" rel="noreferrer">Open {product.name}</a>
            </Button>
            <GuideLink product={product} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-4" />
          </div>
        </div>
      </Reveal>
    </li>
  );
}

export default async function ServicesPage() {
  const pricing = await fetchPublicPricing();
  const core = POWER_SUITE.filter((p) => p.core);
  const rest = POWER_SUITE.filter((p) => !p.core);
  const digitika = SERVICE_PILLARS.find((s) => s.id === 'digitika');

  return (
    <>
      <PageIntro
        eyebrow="Products and services"
        title="Everything your business runs on, from one team."
        lead={`${POWER_SUITE.length} products that share one sign-in, plus the people to build, install and support what your business needs around them.`}
        aside={
          <div className="glass rounded-4xl p-2 shadow-lift">
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl">
              <Image src="/images/products/marketplace-scene.webp" alt="A Codevertex marketplace of retail and hospitality stores on a laptop, with M-Pesa checkout on a phone" fill priority sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        }
      >
        <div className="flex flex-wrap gap-3">
          <Button size="lg" className="rounded-full" asChild><Link href="/contact">Book a demo</Link></Button>
          <Button size="lg" variant="outline" className="rounded-full bg-white/70" asChild>
            <a href={SSO_URL} target="_blank" rel="noreferrer">Sign in to your account</a>
          </Button>
        </div>
      </PageIntro>

      <nav aria-label="Products" className="sticky top-16 lg:top-20 z-30 border-y border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto px-4 sm:px-6 lg:px-8 py-3 [scrollbar-width:none]">
          {[...core, ...rest, MASKANI].map((p) => (
            <a key={p.id} href={`#${p.id}`} className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
              {p.name}
            </a>
          ))}
          <a href="#services" className="shrink-0 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">Services</a>
        </div>
      </nav>

      <section aria-labelledby="products-heading" className="bg-background px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <Reveal className="grid gap-4 lg:grid-cols-12 lg:items-end">
            <h2 id="products-heading" className="lg:col-span-7 font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              The core of the Power Suite
            </h2>
            <p className="lg:col-span-5 text-muted-foreground">
              One account, one set of users and one bill across every product. Prices are the cheapest published monthly plan;
              see <Link href="/pricing" className="text-primary hover:underline underline-offset-4">pricing</Link> for every plan.
            </p>
          </Reveal>
          <Reveal className="mt-6">
            <p className="text-sm text-muted-foreground mb-3">Collect payments and file with KRA through</p>
            <ProviderLogos />
          </Reveal>

          <ul className="mt-14 space-y-20">
            {core.map((p, i) => <CoreProduct key={p.id} product={p} pricing={pricing} flip={i % 2 === 1} />)}
          </ul>

          <Reveal className="mt-20">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">More in the suite</h2>
          </Reveal>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p, i) => {
              const price = formatFromPrice(priceFor(p, pricing));
              return (
                <Reveal key={p.id} as="li" delay={(i % 3) * 80} className="h-full">
                  <div id={p.id} className="flex h-full scroll-mt-28 flex-col rounded-3xl bg-background p-6 shadow-soft ring-1 ring-border/60">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mist"><p.icon className="h-5 w-5 text-primary" aria-hidden /></span>
                      <div>
                        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
                          {p.name}
                          {p.isNew && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">New</span>}
                        </h3>
                        <p className="text-xs text-muted-foreground">{p.tag}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-foreground/85 leading-relaxed">{p.description}</p>
                    <ul className="mt-4 space-y-1.5">
                      {p.highlights.map((h) => (
                        <li key={h} className="flex gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden /> {h}</li>
                      ))}
                    </ul>
                    {price && <p className="mt-4 text-sm font-semibold text-foreground">{price}</p>}
                    <div className="mt-auto pt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
                      <a href={p.url} target="_blank" rel="noreferrer" className="text-foreground hover:text-primary">Open</a>
                      <Link href={`/contact?service=${p.id}`} className="text-primary hover:underline underline-offset-4">Ask about it</Link>
                      <GuideLink product={p} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary" />
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </ul>

          <Reveal className="mt-12 rounded-4xl bg-night text-night-foreground p-8 lg:p-10">
            <div id={MASKANI.id} className="scroll-mt-28 grid gap-6 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8">
                <p className="flex items-center gap-2 text-sm font-semibold text-gold">
                  <MASKANI.icon className="h-4 w-4" aria-hidden /> {MASKANI.name}, sold on its own
                </p>
                <h3 className="mt-2 font-display text-2xl sm:text-3xl font-bold">{MASKANI.summary}</h3>
                <p className="mt-3 text-night-foreground/80 max-w-2xl">{MASKANI.description}</p>
              </div>
              <div className="lg:col-span-4 flex flex-wrap gap-3 lg:justify-end">
                <Button variant="gold" className="rounded-full" asChild><a href={MASKANI.url} target="_blank" rel="noreferrer">Visit Maskani</a></Button>
                <Button variant="outline-light" className="rounded-full" asChild>
                  <a href={docsUrl(MASKANI.docs ?? GENERAL_DOCS.start)} target="_blank" rel="noreferrer">User guide</a>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="services" aria-labelledby="services-heading" className="scroll-mt-32 bg-mist px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <Reveal className="grid gap-4 lg:grid-cols-12 lg:items-end mb-10">
            <h2 id="services-heading" className="lg:col-span-7 font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Services</h2>
            <p className="lg:col-span-5 text-muted-foreground">
              The work we take on for clients, from a single integration to a full system, plus training for your team.
            </p>
          </Reveal>
          <ServiceCards detailed />
          {digitika && (
            <Reveal className="mt-5">
              <Link href="/digitika" className="group grid overflow-hidden rounded-3xl bg-background shadow-soft ring-1 ring-border/60 md:grid-cols-12">
                {digitika.photo && (
                  <div className="relative aspect-[16/9] md:aspect-auto md:col-span-5 min-h-56">
                    <Image src={digitika.photo.src} alt={digitika.photo.alt} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                  </div>
                )}
                <div className="p-6 md:p-8 md:col-span-7">
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary"><digitika.icon className="h-4 w-4" aria-hidden /> Training</p>
                  <h3 className="mt-2 font-display text-2xl font-bold text-foreground">{digitika.name}</h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{digitika.description}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {digitika.features.map((f) => <li key={f} className="rounded-full bg-mist px-3 py-1 text-sm text-foreground/80">{f}</li>)}
                  </ul>
                  <span className="mt-5 inline-block font-semibold text-primary">Explore Digitika</span>
                </div>
              </Link>
            </Reveal>
          )}
        </div>
      </section>

      <CTASection />
    </>
  );
}
