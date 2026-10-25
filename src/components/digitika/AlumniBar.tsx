import Image from 'next/image';
import { ALUMNI_COMPANIES } from '@/config/courses';

/**
 * Employers of Digitika graduates (list confirmed by the company, config/courses.ts), as a slow
 * logo strip like the customer strip on the home page. It pauses on hover.
 */
export function AlumniBar() {
  const items = [...ALUMNI_COMPANIES, ...ALUMNI_COMPANIES, ...ALUMNI_COMPANIES];
  return (
    <section aria-labelledby="alumni-heading" className="border-b border-border bg-background py-10 overflow-hidden">
      <h2 id="alumni-heading" className="text-center text-sm font-semibold text-muted-foreground mb-6 px-4">
        Our graduates work at
      </h2>
      <div className="[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <ul className="flex w-max gap-4 animate-marquee">
          {items.map((company, i) => (
            <li
              key={`${company.name}-${i}`}
              aria-hidden={i >= ALUMNI_COMPANIES.length || undefined}
              title={company.name}
              className="flex h-20 w-52 items-center justify-center rounded-2xl border border-border bg-white px-6 shadow-soft"
            >
              <Image src={company.logo} alt={i < ALUMNI_COMPANIES.length ? company.name : ''} width={160} height={56} className="max-h-12 w-auto object-contain" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
