import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'About Us', description: 'Architecting Africa\'s Digital Renaissance from Kisumu, Kenya since 2020.' };

const TRACK_RECORD = [
  { org: 'Public Sector', detail: 'Delivered ICDL training to 200+ corporate staff under the Digital Economy ICT Initiative.', num: '01' },
  { org: 'Maseno University (MUCISA)', detail: 'Equipped 120+ students with coding, digital entrepreneurship, and employability skills.', num: '02' },
  { org: 'Danka Africa Ltd', detail: 'Led end-to-end digital transformation for a prominent regional energy company.', num: '03' },
  { org: 'KCA University & Future Hubs Kenya', detail: 'Long-term strategic collaborations for training delivery and technology development.', num: '04' },
];

export default function AboutPage() {
  return (
    <div className="pt-16">
      <section className="bg-foreground pt-20 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-125 h-100 bg-primary/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">About us</p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white dark:text-foreground tracking-tight leading-[1.05] max-w-4xl mb-6">
                Architecting Africa&apos;s Digital Renaissance
              </h1>
              <p className="text-white/70 dark:text-muted-foreground text-lg max-w-2xl leading-relaxed">
                Established in 2020. Headquartered in Kisumu, Kenya. Purpose-driven. Pan-African in ambition.
              </p>
            </div>
            <div className="hidden lg:flex flex-col gap-3">
              {[
                { val: '14+', label: 'SaaS products built' },
                { val: '200+', label: 'Staff trained' },
                { val: '120+', label: 'Students certified' },
                { val: '5+', label: 'Years of impact' },
              ].map(s => (
                <div key={s.val} className="flex items-center gap-4 px-5 py-3 rounded-xl bg-white/5 dark:bg-foreground/5 border border-white/10 dark:border-foreground/10">
                  <span className="text-2xl font-black text-primary">{s.val}</span>
                  <span className="text-white/70 dark:text-muted-foreground text-sm font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Who we are</p>
            <h2 className="text-3xl font-black text-foreground tracking-tight mb-6">Beyond software development</h2>
            <p className="text-muted-foreground leading-relaxed mb-4 text-base">
              Codevertex IT Solutions is a premier technology firm and innovation hub headquartered in Kisumu, Kenya. We go beyond software development — we design and deploy integrated digital ecosystems.
            </p>
            <p className="text-muted-foreground leading-relaxed text-base">
              By combining bespoke software engineering, advanced artificial intelligence, robust data analytics, and a high-calibre talent development pipeline, we enable organisations to evolve from legacy systems to agile, data-centric, high-growth operations.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Vision', text: "To serve as the preeminent catalyst for Africa's digital sovereignty, creating a future where equitable access to technology fuels broad-based continental prosperity." },
              { label: 'Mission', text: 'To empower African enterprises, governments, and communities through inclusive, innovative, and practical technology solutions that modernize workforces, digitize economies, and unlock sustainable growth.' },
            ].map(v => (
              <div key={v.label} className="p-6 rounded-2xl bg-card border border-border border-l-4 border-l-primary">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">{v.label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-8">Track record & partners</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TRACK_RECORD.map(t => (
              <div key={t.org} className="flex gap-5 p-6 rounded-2xl bg-card border border-border">
                <span className="font-mono text-xs text-muted-foreground shrink-0 mt-1">{t.num}</span>
                <div>
                  <p className="font-bold text-foreground mb-2">{t.org}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-8">
          <h2 className="text-3xl sm:text-4xl font-black text-white dark:text-primary-foreground tracking-tight">Ready to partner with us?</h2>
          <div className="flex gap-3 shrink-0">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 dark:bg-primary-foreground dark:text-primary dark:hover:bg-primary-foreground/90" asChild>
              <Link href="/contact">Get in touch <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 dark:border-primary-foreground/30 dark:text-primary-foreground dark:hover:bg-primary-foreground/10" asChild>
              <Link href="/careers">Join our team</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
