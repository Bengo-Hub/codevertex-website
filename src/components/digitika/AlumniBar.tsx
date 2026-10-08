import Image from 'next/image';
import { ALUMNI_COMPANIES } from '@/config/courses';

export function AlumniBar() {
  // Triple the list so the seamless loop always has content in view
  const items = [...ALUMNI_COMPANIES, ...ALUMNI_COMPANIES, ...ALUMNI_COMPANIES];

  return (
    <section className="py-10 border-b border-border bg-card overflow-hidden">
      <p className="text-xs font-bold uppercase tracking-widest text-center text-muted-foreground mb-6 px-4">
        Our graduates now work at
      </p>

      {/* Mask fade at edges */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-20 bg-linear-to-r from-card to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-linear-to-l from-card to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee gap-5 w-max">
          {items.map((company, i) => (
            <div
              key={`${company.name}-${i}`}
              aria-hidden={i >= ALUMNI_COMPANIES.length ? true : undefined}
              className="flex items-center justify-center w-44 h-16 rounded-xl bg-background border border-border px-4 py-3 shrink-0 hover:border-primary/30 transition-colors duration-200"
              title={company.name}
            >
              <Image
                src={company.logo}
                alt={company.name}
                width={140}
                height={48}
                className="h-10 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
