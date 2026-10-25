import Image from 'next/image';
import { ALUMNI_COMPANIES } from '@/config/courses';

/** Employers of Digitika graduates (list confirmed by the company, config/courses.ts). */
export function AlumniBar() {
  return (
    <section aria-labelledby="alumni-heading" className="border-b border-border bg-secondary px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-7xl mx-auto lg:flex lg:items-center lg:gap-10">
        <h2 id="alumni-heading" className="text-base font-semibold text-foreground shrink-0 mb-5 lg:mb-0">
          Our graduates work at
        </h2>
        <ul className="flex flex-wrap items-center gap-x-10 gap-y-5">
          {ALUMNI_COMPANIES.map((company) => (
            <li key={company.name} title={company.name}>
              <Image src={company.logo} alt={company.name} width={140} height={48} className="h-9 w-auto object-contain" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
