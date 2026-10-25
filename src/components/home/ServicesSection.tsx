import Link from 'next/link';
import { Reveal } from '@/components/site/Reveal';
import { ServiceCards } from '@/components/site/ServiceCards';

/** What we build for clients beyond the Power Suite. */
export function ServicesSection() {
  return (
    <section id="services" aria-labelledby="services-heading" className="scroll-mt-20 bg-mist px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto">
        <Reveal className="grid gap-4 lg:grid-cols-12 lg:items-end mb-10">
          <div className="lg:col-span-7">
            <p className="text-sm font-semibold text-primary">Custom work</p>
            <h2 id="services-heading" className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
              Built around your business.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-muted-foreground text-lg leading-relaxed">
              When an off-the-shelf product does not fit, we build, host and secure what you need, and connect it to the
              systems you already run.
            </p>
            <Link href="/services#services" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline underline-offset-4">
              Everything we do for clients
            </Link>
          </div>
        </Reveal>
        <ServiceCards />
      </div>
    </section>
  );
}
