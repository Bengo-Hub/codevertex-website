import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CircleCheck as CheckCircle, ExternalLink } from 'lucide-react';
import { POWER_SUITE, SERVICE_PILLARS, STATUS_STYLES } from '@/config/services';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SSO_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Services and Products',
  description: 'Explore the full Codevertex Power Suite and our broader service pillars — ERP, TruLoad, POS, ISP Billing, AI Analytics, Cloud Infrastructure, and Digitika Academy.',
};

export default function ServicesPage() {
  return (
    <div className="pt-16">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="bg-foreground pt-20 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-125 h-125 bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Full Stack · AI · Cloud · Training</p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white dark:text-foreground tracking-tight leading-[1.05] mb-6">
              Everything your<br />business needs.
            </h1>
            <p className="text-white/70 dark:text-muted-foreground text-lg max-w-2xl leading-relaxed mb-8">
              Integrated SaaS products connected by one SSO identity, plus the agency services — software development, AI analytics, cloud infrastructure, hardware integrations, and talent development — that power Africa's most ambitious businesses.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Button asChild>
                <Link href={SSO_URL} target="_blank" rel="noreferrer">
                  Access portal <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="border-white/20 dark:border-foreground/20 text-white dark:text-foreground bg-transparent hover:bg-white/10 dark:hover:bg-foreground/10 hover:border-white/30 dark:hover:border-foreground/30" asChild>
                <Link href="/contact">Book a demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Power Suite ───────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">One Account · One Login</p>
              <h2 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
                The Power Suite
              </h2>
              <p className="text-muted-foreground mt-3 text-base max-w-lg leading-relaxed">
                Eight integrated products sharing a single SSO identity layer — finance, logistics, retail, telecoms, AI, and more.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['OAuth 2.0', 'OpenID Connect', 'AES-256', 'Multi-tenant'].map(b => (
                <span key={b} className="px-3 py-1.5 rounded-full bg-card border border-border text-xs font-semibold text-muted-foreground">{b}</span>
              ))}
            </div>
          </div>

          {/* Product grid — horizontal cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {POWER_SUITE.map((product) => {
              const Icon = product.icon;
              const isDisabled = product.status === 'coming-soon' || product.status === 'offline';
              return (
                <a
                  key={product.id}
                  href={product.url}
                  target={product.url.startsWith('http') ? '_blank' : undefined}
                  rel={product.url.startsWith('http') ? 'noreferrer' : undefined}
                  className={cn(
                    'group flex flex-col rounded-2xl bg-card border border-border overflow-hidden',
                    'hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300',
                    isDisabled && 'opacity-50 pointer-events-none'
                  )}
                >
                  {/* Illustration - full width, dark background */}
                  <div className="relative w-full bg-muted/50 dark:bg-card overflow-hidden" style={{ height: 160 }}>
                    <Image
                      src={product.img}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    {/* Color tint overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(ellipse at center, ${product.color}15, transparent 70%)` }} />
                    {/* Status badge */}
                    <span className={cn('absolute top-3 right-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border', STATUS_STYLES[product.status])}>
                      {product.status.replace('-', ' ')}
                    </span>
                    {/* Color dot */}
                    <div className="absolute bottom-3 left-3 w-8 h-8 rounded-xl bg-card/90 flex items-center justify-center border border-border">
                      <Icon className="h-4 w-4" style={{ color: product.color }} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: product.color }}>{product.tag}</p>
                    <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-3">{product.description}</p>
                    <div className="flex items-center text-xs font-bold pt-3 border-t border-border" style={{ color: product.color }}>
                      Open {product.name}
                      <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Service Pillars ───────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Beyond Software</p>
            <h2 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-tight mb-3">
              What We Build
            </h2>
            <p className="text-muted-foreground text-base max-w-lg leading-relaxed">
              Five core service pillars that power Africa's digital transformation — from bespoke software to AI, cloud, hardware, and talent.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {SERVICE_PILLARS.map((pillar, idx) => {
              const Icon = pillar.icon;
              const isReversed = idx % 2 !== 0;
              return (
                <div
                  key={pillar.id}
                  className="group rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className={cn('grid grid-cols-1 lg:grid-cols-2', isReversed && 'lg:flex lg:flex-row-reverse')}>

                    {/* Illustration — fills entire left/right half */}
                    <div className="relative bg-muted/50 dark:bg-card overflow-hidden" style={{ minHeight: 260 }}>
                      <Image
                        src={pillar.img}
                        alt={pillar.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: `radial-gradient(ellipse at center, ${pillar.color}15, transparent 70%)` }}
                      />
                    </div>

                    {/* Text content */}
                    <div className="p-8 lg:p-10 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: `${pillar.color}15`, borderColor: `${pillar.color}30` }}>
                          <Icon className="h-5 w-5" style={{ color: pillar.color }} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: pillar.color }}>Service Pillar</p>
                          <h3 className="text-xl font-black text-foreground tracking-tight">{pillar.name}</h3>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-muted-foreground mb-3 italic">{pillar.tagline}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-5">{pillar.description}</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-6">
                        {pillar.features.map(f => (
                          <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: pillar.color }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {pillar.cta && (
                        <Button size="sm" asChild className="self-start">
                          <Link href={pillar.cta.href}>
                            {pillar.cta.label} <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">Not sure where to start?</h2>
          <p className="text-muted-foreground text-base mb-8 leading-relaxed">
            Our team will assess your needs and recommend the right combination of Power Suite products and services for your business.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild>
              <Link href="/contact">Talk to an expert <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={SSO_URL} target="_blank" rel="noreferrer">Access client portal <ExternalLink className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
