import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AttachmentApplyForm } from '@/components/careers/AttachmentApplyForm';
import { SITE } from '@/lib/constants';
import {
  ATTACHMENT_BENEFITS,
  ATTACHMENT_FAQ,
  ATTACHMENT_STEPS,
  ATTACHMENT_TRACKS,
  TRACK_GROUPS,
} from '@/config/attachment';

export const metadata: Metadata = {
  title: 'Industrial Attachment & Internships',
  description:
    'Apply for an industrial attachment or internship at Codevertex Africa in Kisumu: 17 tracks across engineering, design, data and business, with a named mentor and real project work.',
  openGraph: {
    title: 'Industrial Attachment & Internships | Codevertex Africa Limited',
    description: 'Hands-on placements in software, mobile, networks, security, AI, design and business. Apply from Kisumu or anywhere in Kenya.',
    url: 'https://codevertexafrica.com/careers/attachment',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'Codevertex Africa Limited' }],
  },
};

export default function AttachmentPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary/30 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-5">
            <GraduationCap className="h-4 w-4" /> Students &amp; graduates
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-4">
            Industrial Attachment &amp; Internships
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Spend your placement building real software, networks and products with a team in Kisumu.
            Choose from {ATTACHMENT_TRACKS.length} tracks and work with a mentor from day one.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <a href="#apply">Apply now <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#tracks">Browse tracks</a>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-black text-foreground mb-8 text-center">How it works</h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ATTACHMENT_STEPS.map((s, i) => (
              <li key={s.title} className="p-5 rounded-2xl bg-card border border-border">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-black mb-3">
                  {i + 1}
                </span>
                <p className="font-bold text-foreground mb-1">{s.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Tracks */}
      <section id="tracks" className="py-14 px-4 sm:px-6 lg:px-8 bg-secondary/30 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-black text-foreground mb-2 text-center">Choose your track</h2>
          <p className="text-sm text-muted-foreground text-center mb-10">
            Not sure which fits? Pick the closest one and tell us more in your note.
          </p>
          <div className="space-y-10">
            {TRACK_GROUPS.map((group) => (
              <div key={group}>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">{group}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ATTACHMENT_TRACKS.filter((t) => t.group === group).map((t) => (
                    <article key={t.id} className="p-5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
                      <h3 className="font-bold text-foreground mb-1">{t.title}</h3>
                      <p className="text-xs text-primary font-semibold mb-3">Best for: {t.forStudents}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{t.tasks}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">You will leave with: </span>{t.deliverable}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-foreground mb-6 text-center">What you get</h2>
          <ul className="grid gap-3">
            {ATTACHMENT_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border text-sm text-foreground">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Apply */}
      <section id="apply" className="py-14 px-4 sm:px-6 lg:px-8 bg-secondary/30 scroll-mt-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-foreground mb-2 text-center">Apply for a placement</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">
            It takes about five minutes. Applications are reviewed on a rolling basis.
          </p>
          <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border">
            <AttachmentApplyForm />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-foreground mb-6 text-center">Questions</h2>
          <div className="space-y-3">
            {ATTACHMENT_FAQ.map((f) => (
              <details key={f.q} className="group rounded-xl bg-card border border-border p-4">
                <summary className="cursor-pointer font-semibold text-foreground text-sm list-none flex items-center justify-between">
                  {f.q}
                  <span className="text-primary transition-transform group-open:rotate-45 text-lg leading-none" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center mt-8">
            Still have a question? Email{' '}
            <a href="mailto:careers@codevertexafrica.com" className="text-primary font-semibold hover:underline">careers@codevertexafrica.com</a>{' '}
            or message us on{' '}
            <a href={SITE.whatsapp} className="text-primary font-semibold hover:underline">WhatsApp</a>.
          </p>
          <p className="text-sm text-center mt-3">
            <Link href="/careers" className="text-primary font-semibold hover:underline">← Back to all careers</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
