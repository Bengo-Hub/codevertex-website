import Image from 'next/image';
import Link from 'next/link';
import { COURSE_CATEGORIES } from '@/config/courses';
import { Button } from '@/components/ui/button';

// Course and discipline counts come from the database (passed by the page) so they never go
// stale. The training figures are the ones in the business profile.
function heroStats(courseCount: number, categoryCount: number) {
  return [
    { value: '200+', label: 'corporate staff trained in ICDL' },
    { value: '120+', label: 'Maseno University students trained' },
    courseCount > 0
      ? { value: String(courseCount), label: `courses in ${categoryCount} subjects` }
      : { value: '25+', label: 'courses' },
    { value: 'In class', label: 'and online, at your pace' },
  ];
}

// A real sequence, so the steps are numbered.
const STEPS = [
  { title: 'Choose a course', desc: 'Software, AI, data, networking, ICDL or kids and teens' },
  { title: 'Enrol and pay', desc: 'M-Pesa or card, in full or in instalments' },
  { title: 'Learn and build', desc: 'Three evenings a week plus Saturday labs' },
  { title: 'Get certified', desc: 'A certificate you can verify online, and a portfolio' },
];

export function DigitikaHero({ courseCount, categoryCount }: { courseCount: number; categoryCount: number }) {
  const stats = heroStats(courseCount, categoryCount);

  return (
    <section className="bg-background pt-28 lg:pt-32 pb-16 px-4 sm:px-6 lg:px-8 border-b border-border">
      <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-6">
          <p className="text-sm font-semibold text-primary mb-5">Digitika Academy, by Codevertex Africa Limited</p>
          <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-foreground leading-[1.03]">
            Learn the skills employers in Kenya are hiring for.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
            Certified courses in software engineering, networking, AI, data and digital skills, taught by working
            engineers, in class and online.
          </p>

          <ul className="mt-7 flex flex-wrap gap-2">
            {COURSE_CATEGORIES.map((c) => (
              <li key={c.id}>
                <Link href={`/digitika?category=${c.id}#courses`} className="inline-block rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            {/* Plain <a>: App Router does not scroll on hash-only Link clicks. */}
            <Button asChild size="lg"><a href="#courses">Browse courses</a></Button>
            <Button variant="outline" asChild size="lg"><Link href="/contact?service=digitika">Training for your team</Link></Button>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-8 max-w-xl">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block font-display text-3xl font-bold text-foreground">{s.value}</span>
                  <span className="block text-sm text-muted-foreground mt-1">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-6 space-y-4">
          <figure>
            <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-muted">
              <Image src="/images/photos/hackathon-pairing.webp" alt="Students working through code together at the MUCISA Hackathon 2025" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
            <figcaption className="mt-2 text-sm text-muted-foreground">Students at the MUCISA Hackathon 2025, Maseno University.</figcaption>
          </figure>

          <div className="rounded-lg bg-night text-night-foreground p-6 sm:flex sm:items-center sm:justify-between gap-6">
            <div>
              <p className="font-semibold">Already enrolled?</p>
              <p className="text-sm text-night-foreground/70 mt-1">See your payment schedule, pay an instalment and open your lessons.</p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-2 shrink-0">
              <Button variant="gold" asChild><Link href="/digitika/my-enrollment">My enrolment</Link></Button>
              <Button variant="outline-light" asChild><Link href="/digitika/parent">Parent portal</Link></Button>
            </div>
          </div>
        </div>
      </div>

      <ol className="max-w-7xl mx-auto mt-14 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="bg-background px-6 py-5">
            <span className="text-sm font-semibold text-primary">Step {i + 1}</span>
            <p className="font-semibold text-foreground mt-1">{s.title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{s.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
