import Image from 'next/image';
import Link from 'next/link';

// Institutional work named in the Codevertex Africa Limited business profile.
const TRACK_RECORD = [
  { name: 'Digital Economy ICT Initiative', detail: 'ICDL training for more than 200 corporate staff' },
  { name: 'Maseno University (MUCISA)', detail: 'Coding, digital entrepreneurship and employability skills for more than 120 students' },
  { name: 'Danka Africa Ltd', detail: 'Digital transformation for a regional energy company' },
  { name: 'KCA University and Future Hubs Kenya', detail: 'Long-term training and technology partners' },
];

const PRACTICES = [
  { title: 'One partner from build to support', desc: 'Software, hosting, domains, hardware installation and training from the same team.' },
  { title: 'Secure by default', desc: 'Single sign-on with OAuth 2.0 and OpenID Connect, encrypted data and per-business access rules.', href: '/security' },
  { title: 'Built for how Kenya pays', desc: 'M-Pesa, PayHero and Paystack collections and KRA eTIMS invoicing are part of the products, not add-ons.' },
  { title: 'Registered and accountable', desc: 'Codevertex Africa Limited is a private limited company (PVT-VQ1OEVB3) under the Kenya Companies Act, 2015.' },
];

export function TrustSection() {
  return (
    <section aria-labelledby="company-heading" className="bg-background px-4 sm:px-6 lg:px-8 py-20 lg:py-28 border-t border-border">
      <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <figure>
            <div className="relative aspect-3/4 overflow-hidden rounded-lg bg-muted">
              <Image
                src="/images/photos/brand-vest.webp"
                alt="A Codevertex Africa Limited high-visibility vest marked ENG.T on an office chair"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 text-sm text-muted-foreground">Ready for the next site visit, at the Kisumu office.</figcaption>
          </figure>
        </div>

        <div className="lg:col-span-7">
          <h2 id="company-heading" className="font-display text-4xl font-bold tracking-tight text-foreground leading-tight">
            A Kisumu company, working across East Africa.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            We started in 2020 and incorporated as Codevertex Africa Limited in May 2026. Our office is at Pioneer House
            on Oginga-Odinga Road, opposite Mega Plaza, and our engineers work on sites from Kisumu to Tanzania.
          </p>

          <h3 className="mt-12 font-semibold text-foreground">Track record</h3>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {TRACK_RECORD.map((c) => (
              <li key={c.name} className="py-4 sm:flex sm:gap-6">
                <p className="font-medium text-foreground sm:w-64 shrink-0">{c.name}</p>
                <p className="text-sm text-muted-foreground mt-1 sm:mt-0">{c.detail}</p>
              </li>
            ))}
          </ul>

          <h3 className="mt-12 font-semibold text-foreground">How we work</h3>
          <dl className="mt-4 grid gap-6 sm:grid-cols-2">
            {PRACTICES.map((p) => (
              <div key={p.title}>
                <dt className="font-medium text-foreground">{p.title}</dt>
                <dd className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {p.desc}{' '}
                  {p.href && <Link href={p.href} className="text-primary hover:underline underline-offset-4">Security practices</Link>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
