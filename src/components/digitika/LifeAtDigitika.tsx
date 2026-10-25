import Image from 'next/image';
import Link from 'next/link';

const GALLERY_ITEMS = [
  { src: '/images/photos/hackathon-talk.webp', alt: 'A Codevertex panelist speaking at the MUCISA Hackathon 2025', caption: 'MUCISA Hackathon 2025, Maseno University' },
  { src: '/images/photos/hackathon-laptops.webp', alt: 'Students coding on laptops in a lecture hall', caption: 'Hands-on work in every session' },
  { src: '/images/photos/hackathon-team-table.webp', alt: 'Students and mentors at a team table', caption: 'Mentors from the Codevertex team' },
];

// Programme facts, as published by Digitika (confirmed by the company).
const HIGHLIGHTS = [
  { stat: '3', label: 'evenings a week, in person or online' },
  { stat: '2 to 12', label: 'weeks to a recognised certificate' },
  { stat: '100%', label: 'hands-on, project-based curriculum' },
  { stat: 'M-Pesa', label: 'card or instalment plans' },
];

const PRACTICAL = [
  { label: 'Next intake', value: 'Rolling intake', sub: 'See each course for start dates' },
  { label: 'Where', value: 'Kisumu and online', sub: 'Pioneer House, Oginga-Odinga Road' },
  { label: 'Payment', value: 'M-Pesa or card', sub: 'Paybill 542542, account 87660' },
  { label: 'Length', value: '2 to 12 weeks', sub: 'Depending on the programme' },
];

export function LifeAtDigitika() {
  return (
    <section aria-labelledby="life-heading" className="bg-background px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-7xl mx-auto">
        <h2 id="life-heading" className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground max-w-2xl">
          Small classes, real projects, working engineers as mentors.
        </h2>

        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8 grid gap-4 sm:grid-cols-2">
            {GALLERY_ITEMS.map((item, i) => (
              <figure key={item.src} className={i === 0 ? 'sm:col-span-2' : ''}>
                <div className={`relative overflow-hidden rounded-md bg-secondary ${i === 0 ? 'aspect-2/1' : 'aspect-4/3'}`}>
                  <Image src={item.src} alt={item.alt} fill className="object-cover" sizes={i === 0 ? '(min-width: 1024px) 60vw, 100vw' : '(min-width: 1024px) 30vw, 50vw'} />
                </div>
                <figcaption className="mt-2 text-sm text-muted-foreground">{item.caption}</figcaption>
              </figure>
            ))}
          </div>

          <div className="lg:col-span-4">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-6">
              {HIGHLIGHTS.map((h) => (
                <div key={h.label}>
                  <dt className="sr-only">{h.label}</dt>
                  <dd>
                    <span className="block font-display text-3xl font-bold text-foreground">{h.stat}</span>
                    <span className="block text-sm text-muted-foreground mt-1">{h.label}</span>
                  </dd>
                </div>
              ))}
            </dl>

            <figure className="mt-10 border-l-2 border-gold pl-5">
              <blockquote className="text-foreground leading-relaxed">
                &ldquo;I enrolled in Code-Starter with zero programming experience. Eight weeks later, I had a full portfolio
                and a junior developer role lined up. The instructors don&apos;t just teach, they build with you.&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-sm">
                <span className="font-semibold text-foreground">Aisha K.</span>
                <span className="text-muted-foreground">, Code-Starter graduate, now at Safaricom PLC</span>
              </figcaption>
            </figure>

            <p className="mt-10 text-sm text-muted-foreground leading-relaxed">
              Our team took part in the MUCISA Hackathon 2025 with the Maseno University Computer and IT Students&apos;
              Association, working with student teams on real problems.{' '}
              <Link href="/projects/mucisa-hackathon-2025" className="text-primary font-semibold hover:underline underline-offset-4">See the photos</Link>
            </p>
          </div>
        </div>

        <dl className="mt-14 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {PRACTICAL.map((item) => (
            <div key={item.label} className="bg-background px-6 py-5">
              <dt className="text-sm text-muted-foreground">{item.label}</dt>
              <dd className="mt-1">
                <span className="block font-semibold text-foreground">{item.value}</span>
                <span className="block text-sm text-muted-foreground mt-0.5">{item.sub}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
