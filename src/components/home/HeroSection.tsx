import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { POWER_SUITE } from '@/config/services';
import { SITE } from '@/lib/constants';

/**
 * Home page opening: the roll-up headline, what the company does in one paragraph, and a few
 * figures. The business count is live from auth-api's marketplace; the training figures are
 * the ones confirmed in the business profile.
 */
export function HeroSection({ liveBusinesses }: { liveBusinesses: number }) {
  const facts = [
    liveBusinesses > 0 && { value: String(liveBusinesses), label: 'businesses run on the Power Suite today' },
    { value: String(POWER_SUITE.length), label: 'products under one sign-in' },
    { value: '200+', label: 'staff trained in ICDL digital skills' },
    { value: '120+', label: 'Maseno University students trained in coding' },
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <section className="bg-background pt-28 lg:pt-32 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6 animate-fade-in">
          <p className="flex items-center gap-2.5 text-sm font-semibold text-primary mb-6">
            <Image src="/images/brand/logo-mark.png" alt="" width={20} height={20} className="h-5 w-5" />
            {SITE.tagline}
          </p>
          <h1 className="font-display text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.02] text-foreground">
            Software that runs African business.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl text-pretty">
            Point of sale, stock, books, payroll, clinics, libraries and weighbridges, all under one sign-in.
            We build it, install it and support it from our office in Kisumu.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/services">See the products</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Talk to us</Link>
            </Button>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-8 max-w-xl">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="sr-only">{f.label}</dt>
                <dd>
                  <span className="block font-display text-3xl font-bold text-foreground">{f.value}</span>
                  <span className="block text-sm text-muted-foreground mt-1 leading-snug">{f.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="lg:col-span-6">
          <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-muted">
            <Image
              src="/images/photos/team-mucisa-2025.webp"
              alt="Four members of the Codevertex team in company shirts at the MUCISA Hackathon 2025"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-[center_30%]"
            />
          </div>
          <figcaption className="mt-3 text-sm text-muted-foreground">
            Part of the team at the MUCISA Hackathon 2025, Maseno University, where we served as panelists.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
