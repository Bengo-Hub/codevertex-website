import type { Metadata } from 'next';
import { PlatformEcosystemMap } from '@/components/platform/PlatformEcosystemMap';
import { PlatformAuditFindings } from '@/components/platform/PlatformAuditFindings';

export const metadata: Metadata = {
  title: 'Platform Architecture',
  description: "How the Codevertex Power Suite's services fit together, and an honest look at where this site stands today.",
};

const JUMP_LINKS = [
  { href: '#ecosystem', label: 'Ecosystem map' },
  { href: '#s1', label: 'Digitika' },
  { href: '#s2', label: 'Vera' },
  { href: '#s3', label: 'Trust & Security' },
  { href: '#s4', label: 'Enterprise' },
  { href: '#s5', label: 'Infrastructure' },
  { href: '#s6', label: 'Growth' },
];

export default function PlatformPage() {
  return (
    <div className="pt-20">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="bg-foreground pt-20 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-125 h-125 bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">How it fits together</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white dark:text-foreground tracking-tight leading-[1.05] mb-6">
            What Codevertex actually is.
          </h1>
          <p className="text-white/70 dark:text-muted-foreground text-lg max-w-2xl leading-relaxed">
            Codevertex isn&apos;t one product — it&apos;s a whole suite of them, built to work together. Here&apos;s a map of how the pieces connect, followed by an honest look at where this particular site stands: what&apos;s real, what still needs doing, and what turned out to already exist somewhere else.
          </p>
        </div>
      </section>

      {/* ── Jump nav ─────────────────────────────────────────────── */}
      <nav className="sticky top-16 z-20 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {JUMP_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="shrink-0 whitespace-nowrap text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full hover:bg-secondary transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
      </nav>

      {/* ── Ecosystem map ────────────────────────────────────────── */}
      <section id="ecosystem" className="py-16 px-4 sm:px-6 lg:px-8 bg-background scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-2">The service ecosystem</h2>
          <p className="text-muted-foreground max-w-2xl mb-10">
            Under the hood, everything shares one login system, one billing engine, and one message bus connecting it all — so a sale on the till, a payroll run, and a support ticket all end up talking to each other without anyone wiring it by hand. This site is one node in that same graph.
          </p>
          <PlatformEcosystemMap />
        </div>
      </section>

      {/* ── Audit ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-2">Where this site actually stands</h2>
          <p className="text-muted-foreground max-w-2xl mb-10">
            A recent review of this site raised a long list of gaps. Rather than just filing it away, we checked each one against what’s really built across the platform — some held up, some turned out to already be solved elsewhere, and a couple were more nuanced than they first looked.
          </p>
          <PlatformAuditFindings />
        </div>
      </section>
    </div>
  );
}
