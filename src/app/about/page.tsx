import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageIntro } from '@/components/site/PageIntro';
import { CTASection } from '@/components/home/CTASection';
import { POWER_SUITE } from '@/config/services';
import { SITE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About us',
  description: `Codevertex Africa Limited is a software and technology company in Kisumu, Kenya. ${SITE.tagline}.`,
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
  { label: 'Incorporated', value: '21 May 2026, under the Kenya Companies Act, 2015' },
  { label: 'Operating since', value: '2020, first as Codevertex IT Solutions' },
  { label: 'Office', value: SITE.address },
];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        title={SITE.tagline}
        lead="Codevertex Africa Limited builds business software, installs the hardware it runs on, and trains the people who use it. We work from Kisumu, with clients across Kenya and East Africa."
        aside={
          <figure>
            <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-muted">
              <Image src="/images/photos/team-mucisa-2025.webp" alt="Members of the Codevertex team at the MUCISA Hackathon 2025" fill priority sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </figure>
        }
      />

      <section className="bg-background px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-5 text-lg text-foreground/85 leading-relaxed">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">What we do</h2>
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
          </div>

          <div className="lg:col-span-5 space-y-6">
            {[
              { label: 'Vision', text: "To serve as the preeminent catalyst for Africa's digital sovereignty, creating a future where equitable access to technology fuels broad-based continental prosperity." },
              { label: 'Mission', text: 'To empower African enterprises, governments, and communities through inclusive, innovative, and practical technology solutions that modernize workforces, digitize economies, and unlock sustainable growth.' },
            ].map((v) => (
              <div key={v.label} className="border-l-2 border-gold pl-5">
                <h3 className="font-semibold text-foreground">{v.label}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">Track record</h2>
            <ul className="mt-6 divide-y divide-border border-y border-border">
              {TRACK_RECORD.map((t) => (
                <li key={t.org} className="py-5">
                  <p className="font-semibold text-foreground">{t.org}</p>
                  <p className="mt-1 text-muted-foreground">{t.detail}</p>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-8" asChild><Link href="/projects">See our projects</Link></Button>
          </div>

          <div className="lg:col-span-6">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">Company details</h2>
            <dl className="mt-6 divide-y divide-border border-y border-border">
              {COMPANY_FACTS.map((f) => (
                <div key={f.label} className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm text-muted-foreground">{f.label}</dt>
                  <dd className="sm:col-span-2 text-foreground">{f.value}</dd>
                </div>
              ))}
            </dl>
            <figure className="mt-8">
              <div className="relative aspect-16/9 overflow-hidden rounded-md bg-muted">
                <Image src="/images/photos/kisumu-oginga-odinga-street.webp" alt="Oginga Odinga Street in Kisumu CBD" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
              </div>
              <figcaption className="mt-2 text-xs text-muted-foreground">
                Oginga Odinga Street, Kisumu, where our office is. Photo: Leo Hempstone, CC0, via Wikimedia Commons.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <CTASection title="Work with us, or join the team." lead="Tell us about your project, or see the roles and attachment places we have open." />
    </>
  );
}
