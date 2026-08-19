import { ArrowUpRight } from 'lucide-react';
import { BACKBONE, SERVICES, EARLY_STAGE } from '@/config/platform-ecosystem';

export function PlatformEcosystemMap() {
  return (
    <div>
      {/* ── Backbone ─────────────────────────────────────────────── */}
      <div className="mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">The backbone</p>
        <p className="text-sm text-muted-foreground max-w-2xl">Four platform-wide layers every product below builds on — nothing here is product-specific.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
        {BACKBONE.map((n) => (
          <div key={n.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: `${n.color}1a` }}>
                <n.icon className="w-5 h-5" style={{ color: n.color }} />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm leading-tight">{n.name}</h3>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">{n.role}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{n.description}</p>
          </div>
        ))}
      </div>

      {/* ── Services ─────────────────────────────────────────────── */}
      <div className="mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">The products, and how they connect</p>
        <p className="text-sm text-muted-foreground max-w-2xl">Every card below sits on top of the backbone above. "Talks to" lists the real, confirmed connections — not an aspirational diagram.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICES.map((s) => (
          <div key={s.id} className="rounded-2xl border border-border bg-card p-5 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${s.color}1a` }}>
                  <s.icon className="w-4.5 h-4.5" style={{ color: s.color }} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm leading-tight">{s.name}</h4>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">{s.category}</p>
                </div>
              </div>
              {s.url && (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-primary transition-colors" aria-label={`Open ${s.name}`}>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1">{s.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {s.talksTo.map((t) => (
                <span key={t} className="text-[10px] font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground border border-border">
                  {t}
                </span>
              ))}
            </div>
            {!s.publicProduct && (
              <p className="text-[10px] text-muted-foreground/70 italic mt-3">Internal to the suite — not a marketed standalone product.</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Early stage ──────────────────────────────────────────── */}
      <div className="mt-10 p-5 rounded-2xl border border-dashed border-border bg-secondary/40">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Early-stage / not yet live</p>
        <p className="text-sm text-muted-foreground">{EARLY_STAGE.join(' · ')}</p>
      </div>
    </div>
  );
}
