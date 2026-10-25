import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, Compass, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntroImage, PageIntro } from '@/components/site/PageIntro';
import { Reveal } from '@/components/site/Reveal';
import { CTASection } from '@/components/home/CTASection';
import { POWER_SUITE } from '@/config/services';
import { SITE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About us',
  description: `Codevertex Africa Limited is an East African software and technology company, registered in Kenya. ${SITE.tagline}.`,
};

// Track record as stated in the Codevertex Africa Limited business profile.
const TRACK_RECORD = [
  { org: 'Digital Economy ICT Initiative', detail: 'Customised ICDL training for more than 200 corporate staff.' },
  { org: 'Maseno University (MUCISA)', detail: 'More than 120 students trained in coding, digital entrepreneurship and employability skills.' },
  { org: 'Danka Africa Ltd', detail: 'End-to-end digital transformation for a regional energy company.' },
  { org: 'KCA University and Future Hubs Kenya', detail: 'Long-term partners in training delivery and technology development.' },
];

const COMPANY_FACTS = [
  { label: 'Registered name', value: 'Codevertex Africa Limited' },
  { label: 'Company number', value: 'PVT-VQ1OEVB3' },
  { label: 'Incorporated', value: '21 May 2026, Kenya Companies Act, 2015' },
  { label: 'Operating since', value: '2020, first as Codevertex IT Solutions' },
  { label: 'Office', value: SITE.address },
];

const STATEMENTS = [
  { label: 'Vision', icon: Compass, text: "To serve as the preeminent catalyst for Africa's digital sovereignty, creating a future where equitable access to technology fuels broad-based continental prosperity." },
  { label: 'Mission', icon: Target, text: 'To empower African enterprises, governments, and communities through inclusive, innovative, and practical technology solutions that modernize workforces, digitize economies, and unlock sustainable growth.' },
];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="About Codevertex Africa Limited"
        title={SITE.tagline}
        lead="We build business software, install the hardware it runs on, and train the people who use it. We serve businesses and institutions across Kenya and East Africa."
        aside={
          <IntroImage>
            <Image src="/images/photos/team-mucisa-2025.webp" alt="Members of the Codevertex team at the MUCISA Hackathon 2025" fill priority sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover object-[center_30%]" />
          </IntroImage>
        }
      >
        <div className="flex flex-wrap gap-3">
          <Button className="rounded-full" asChild><Link href="/contact">Talk to us</Link></Button>
          <Button variant="outline" className="rounded-full bg-white/70" asChild><Link href="/projects">See our projects</Link></Button>
        </div>
      </PageIntro>

      <section className="bg-background px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-12 lg:items-center">
          <Reveal className="lg:col-span-7 space-y-5 text-lg text-foreground/85 leading-relaxed">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">What we do</h2>
            <p>
              Most of our clients come to us with a business to run, not a software project. A shop that needs a till that
              works when the internet drops. A weighbridge that needs every truck&apos;s plate on its weight ticket. A library
              that still lends books from a paper register.
            </p>
            <p>
              For them we built the Power Suite: {POWER_SUITE.length} products that share one sign-in, from point of sale and
              stock to books, payroll, clinics and weighbridges. Where a product does not fit, we build what is needed, host it,
              secure it and connect it to the cameras, scales and payment systems around it.
            </p>
            <p>
              Digitika Academy, our training arm, teaches software engineering, networking, data and digital skills to learners
              and to client teams, so the people using the systems can run them well.
            </p>
          </Reveal>

          <div className="lg:col-span-5 grid gap-4">
            {STATEMENTS.map((s, i) => (
              <Reveal key={s.label} delay={i * 120} className="rounded-3xl bg-mist p-6">
                <h3 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
                  <s.icon className="h-5 w-5 text-primary" aria-hidden /> {s.label}
                </h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-mist px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Track record</h2>
          </Reveal>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRACK_RECORD.map((t, i) => (
              <Reveal key={t.org} as="li" delay={i * 100} className="glass rounded-3xl p-6">
                <p className="font-display text-lg font-bold text-foreground leading-snug">{t.org}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t.detail}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-background px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-2 lg:items-stretch">
          <Reveal className="rounded-3xl border border-border p-6 sm:p-8 shadow-soft">
            <h2 className="flex items-center gap-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              <Building2 className="h-6 w-6 text-primary" aria-hidden /> Company details
            </h2>
            <dl className="mt-6 divide-y divide-border">
              {COMPANY_FACTS.map((f) => (
                <div key={f.label} className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm text-muted-foreground">{f.label}</dt>
                  <dd className="sm:col-span-2 text-foreground">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal as="figure" delay={120} className="flex flex-col">
            <div className="relative flex-1 min-h-64 overflow-hidden rounded-3xl shadow-soft">
              <Image src="/images/photos/kisumu-mega-plaza.webp" alt="Mega Plaza on Oginga-Odinga Road, Kisumu" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              <figcaption className="glass absolute left-4 bottom-4 right-4 sm:right-auto rounded-2xl px-4 py-3">
                <span className="block text-sm font-semibold text-foreground">Find us at Pioneer House</span>
                <span className="block text-xs text-muted-foreground">Opposite Mega Plaza, Oginga-Odinga Road, Kisumu</span>
              </figcaption>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Photo: Leo Hempstone, CC0, via Wikimedia Commons.</p>
          </Reveal>
        </div>
      </section>

      <CTASection title="Work with us, or join the team." lead="Tell us about your project, or see the roles and attachment places we have open." />
    </>
  );
}
