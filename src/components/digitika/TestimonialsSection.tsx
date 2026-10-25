import { GRADUATE_TESTIMONIALS } from '@/config/courses';

/** Graduate quotes (confirmed by the company, config/courses.ts). */
export function TestimonialsSection() {
  return (
    <section aria-labelledby="stories-heading" className="bg-secondary px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-7xl mx-auto">
        <h2 id="stories-heading" className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground max-w-2xl">
          What our graduates say
        </h2>

        <ul className="mt-10 grid gap-x-10 gap-y-12 md:grid-cols-2">
          {GRADUATE_TESTIMONIALS.map((t) => (
            <li key={t.name}>
              <figure>
                <blockquote className="text-lg text-foreground leading-relaxed border-l-2 border-gold pl-5">
                  <p>&ldquo;{t.quote}&rdquo;</p>
                </blockquote>
                <figcaption className="mt-4 pl-5 text-sm">
                  <span className="font-semibold text-foreground">{t.name}</span>
                  <span className="text-muted-foreground">, {t.role}, {t.company}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
