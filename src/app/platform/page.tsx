import type { Metadata } from 'next';
import { PlatformEcosystemMap } from '@/components/platform/PlatformEcosystemMap';
import { PlatformAuditFindings } from '@/components/platform/PlatformAuditFindings';

export const metadata: Metadata = {
  title: 'Platform Architecture',
  description:
    "A living map of the Codevertex Power Suite's ~20 services and how they connect, plus a section-by-section audit of the platform against a recent roadmap review.",
};

const JUMP_LINKS = [
  { href: '#ecosystem', label: 'Ecosystem map' },
  { href: '#urgent', label: 'Urgent' },
  { href: '#s1', label: 'Digitika LMS' },
  { href: '#s2', label: 'Vera Chatbot' },
  { href: '#s3', label: 'Trust & Security' },
  { href: '#s4', label: 'Enterprise' },
  { href: '#s5', label: 'Technical' },
  { href: '#s6', label: 'Growth' },
  { href: '#shipped', label: 'What shipped' },
];

export default function PlatformPage() {
  return (
    <div className="pt-20">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="bg-foreground pt-20 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-125 h-125 bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Engineering &middot; Platform Reference</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white dark:text-foreground tracking-tight leading-[1.05] mb-6">
            How Codevertex actually fits together.
          </h1>
          <p className="text-white/70 dark:text-muted-foreground text-lg max-w-2xl leading-relaxed">
            A living map of the Power Suite&apos;s ~20 services and how they connect, followed by a section-by-section fact-check of a recent platform roadmap review against the real codebase &mdash; what&apos;s genuinely missing, what&apos;s already built and just needs wiring, and one thing that needed fixing immediately.
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
            Codevertex isn&apos;t one app &mdash; it&apos;s a fleet of independently deployed services sharing one identity layer, one billing/entitlements layer, and one event bus. This site is one node in that graph too.
          </p>
          <PlatformEcosystemMap />
        </div>
      </section>

      {/* ── Audit ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-2">Roadmap reality check</h2>
          <p className="text-muted-foreground max-w-2xl mb-10">
            An intern&apos;s gap-analysis reviewed one repo &mdash; this site. Here&apos;s every item from that review, fact-checked against the other ~19 services.
          </p>
          <PlatformAuditFindings />
        </div>
      </section>
    </div>
  );
}
