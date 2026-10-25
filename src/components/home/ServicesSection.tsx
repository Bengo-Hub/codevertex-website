import Link from 'next/link';
import { SERVICE_PILLARS } from '@/config/services';

/** What we build for clients beyond the Power Suite, as a two-column list. */
export function ServicesSection() {
  return (
    <section aria-labelledby="services-heading" className="bg-secondary px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="services-heading" className="font-display text-4xl font-bold tracking-tight text-foreground leading-tight">
            Built around your business.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            When an off-the-shelf product does not fit, we build, host and secure what you need, and train your people
            to use it.
          </p>
          <Link href="/services#services" className="mt-6 inline-block font-semibold text-primary hover:underline underline-offset-4">
            All services
          </Link>
        </div>

        <ul className="lg:col-span-8 grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {SERVICE_PILLARS.map((s) => (
            <li key={s.id}>
              <s.icon className="h-5 w-5 text-primary mb-3" aria-hidden />
              <h3 className="font-semibold text-foreground text-lg">{s.name}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{s.tagline}</p>
              <p className="text-[15px] text-foreground/80 mt-3 leading-relaxed">{s.description}</p>
              {s.cta && (
                <Link href={s.cta.href} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline underline-offset-4">
                  {s.cta.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
