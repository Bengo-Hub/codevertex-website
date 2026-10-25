import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { SERVICE_PILLARS, type ServicePillar } from '@/config/services';
import { Reveal } from '@/components/site/Reveal';

/** The client services (everything except Digitika, which has its own section), as photo cards. */
export const CLIENT_SERVICES: ServicePillar[] = SERVICE_PILLARS.filter((s) => s.id !== 'digitika');

/**
 * Equal-height photo cards in a 1, 2 or 3 column grid. Six services fill two rows of three
 * exactly, so no row is left half empty. `detailed` adds the feature list (Products page).
 */
export function ServiceCards({ services = CLIENT_SERVICES, detailed = false }: { services?: ServicePillar[]; detailed?: boolean }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((s, i) => (
        <Reveal key={s.id} as="li" delay={(i % 3) * 100} className="h-full">
          <Link
            id={`service-${s.id}`}
            href={s.cta?.href ?? '/contact'}
            className="group flex h-full scroll-mt-28 flex-col overflow-hidden rounded-3xl bg-background shadow-soft ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-mist">
              {s.photo && (
                <Image src={s.photo.src} alt={s.photo.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
              )}
              <span className="glass absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl">
                <s.icon className="h-5 w-5 text-primary" aria-hidden />
              </span>
              {s.photo?.credit && (
                <span className="absolute right-2 bottom-2 max-w-[85%] rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white/90">{s.photo.credit}</span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="font-display text-xl font-bold text-foreground">{s.name}</h3>
              <p className="text-sm text-primary mt-1">{s.tagline}</p>
              <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">{s.description}</p>
              {detailed && (
                <ul className="mt-4 space-y-1.5">
                  {s.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-foreground/80">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden /> {f}
                    </li>
                  ))}
                </ul>
              )}
              {s.cta && (
                <span className="mt-auto pt-5 text-sm font-semibold text-primary">
                  <span className="border-b border-transparent transition-colors group-hover:border-primary">{s.cta.label}</span>
                </span>
              )}
            </div>
          </Link>
        </Reveal>
      ))}
    </ul>
  );
}
