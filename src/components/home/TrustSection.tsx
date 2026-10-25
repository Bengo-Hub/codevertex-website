import Image from 'next/image';
import Link from 'next/link';
import { HandCoins, Handshake, Landmark, ShieldCheck } from 'lucide-react';
import { Reveal } from '@/components/site/Reveal';

// Institutional work named in the Codevertex Africa Limited business profile.
const TRACK_RECORD = [
  { name: 'Digital Economy ICT Initiative', detail: 'ICDL training for more than 200 corporate staff' },
  { name: 'Maseno University (MUCISA)', detail: 'Coding, digital entrepreneurship and employability skills for more than 120 students' },
  { name: 'Danka Africa Ltd', detail: 'Digital transformation for a regional energy company' },
  { name: 'KCA University and Future Hubs Kenya', detail: 'Long-term training and technology partners' },
];

const PRACTICES = [
  { icon: Handshake, title: 'One partner from build to support', desc: 'Software, hosting, domains, hardware installation and training from the same team.' },
  { icon: ShieldCheck, title: 'Secure by default', desc: 'Single sign-on with OAuth 2.0 and OpenID Connect, encrypted data and per-business access rules.', href: '/security' },
  { icon: HandCoins, title: 'Built for how Kenya pays', desc: 'M-Pesa, PayHero and Paystack collections and KRA eTIMS invoicing are part of the products.' },
  { icon: Landmark, title: 'Registered and accountable', desc: 'A private limited company (PVT-VQ1OEVB3) under the Kenya Companies Act, 2015.' },
];

export function TrustSection() {
  return (
    <section aria-labelledby="company-heading" className="bg-mist px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-12 lg:items-center">
        <Reveal as="figure" className="lg:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-4xl shadow-lift">
            <Image src="/images/photos/brand-vest.webp" alt="A Codevertex Africa Limited high-visibility vest marked ENG.T on an office chair" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
            <figcaption className="glass absolute left-4 right-4 bottom-4 rounded-2xl px-4 py-3">
              <span className="block text-sm font-semibold text-foreground">Ready for the next site visit</span>
              <span className="block text-xs text-muted-foreground">At our office, Pioneer House</span>
            </figcaption>
          </div>
        </Reveal>

        <div className="lg:col-span-7">
          <Reveal>
            <p className="text-sm font-semibold text-primary">Why clients trust us</p>
            <h2 id="company-heading" className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
              A Kenyan company, working across East Africa.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              We started in 2020 and incorporated as Codevertex Africa Limited in May 2026. Our engineers work on client sites
              across Kenya, from Nairobi and Mombasa to Kisumu, and across the border in Tanzania, and our office is open
              for clients to walk in.
            </p>
          </Reveal>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {PRACTICES.map((p, i) => (
              <Reveal key={p.title} as="li" delay={i * 80} className="glass rounded-3xl p-5">
                <p className="flex items-center gap-2 font-semibold text-foreground">
                  <p.icon className="h-5 w-5 text-primary" aria-hidden /> {p.title}
                </p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {p.desc}{' '}
                  {p.href && <Link href={p.href} className="text-primary hover:underline underline-offset-4">Security practices</Link>}
                </p>
              </Reveal>
            ))}
          </ul>

          <Reveal className="mt-8">
            <h3 className="font-semibold text-foreground">Track record</h3>
            <ul className="mt-3 divide-y divide-border/70 rounded-3xl bg-background px-5 shadow-soft">
              {TRACK_RECORD.map((c) => (
                <li key={c.name} className="py-3.5 sm:flex sm:gap-6">
                  <p className="font-medium text-foreground sm:w-60 shrink-0">{c.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 sm:mt-0">{c.detail}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
