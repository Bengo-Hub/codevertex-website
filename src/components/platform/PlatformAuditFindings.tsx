import { AlertTriangle } from 'lucide-react';
import { renderInlineMd } from '@/lib/render-inline-md';
import {
  AUDIT_SECTIONS, OVERVIEW_STATS, SHIPPED_TODAY, STATUS_LABEL, URGENT_CALLOUT,
  type FindingStatus,
} from '@/config/platform-audit-findings';

const STATUS_CLASSES: Record<FindingStatus, string> = {
  ok: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  partial: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  missing: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  outrepo: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  bizdep: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  urgent: 'bg-red-600/15 text-red-700 dark:text-red-400',
};

const STAT_TONE_CLASSES: Record<string, string> = {
  urgent: 'text-red-700 dark:text-red-400',
  ok: 'text-emerald-600 dark:text-emerald-400',
  partial: 'text-amber-600 dark:text-amber-400',
  outrepo: 'text-blue-600 dark:text-blue-400',
  default: 'text-foreground',
};

const DOT_CLASSES: Record<FindingStatus, string> = {
  ok: 'bg-emerald-500',
  partial: 'bg-amber-500',
  missing: 'bg-rose-500',
  outrepo: 'bg-blue-500',
  bizdep: 'bg-violet-500',
  urgent: 'bg-red-600',
};

function StatusBadge({ status }: { status: FindingStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider mb-2 ${STATUS_CLASSES[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PlatformAuditFindings() {
  return (
    <div>
      {/* ── Overview stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-border rounded-2xl overflow-hidden border border-border mb-4">
        {OVERVIEW_STATS.map((s) => (
          <div key={s.label} className="bg-card p-4 sm:p-5">
            <div className={`text-3xl font-black tabular-nums ${STAT_TONE_CLASSES[s.tone]}`}>{s.n}</div>
            <div className="text-[11px] text-muted-foreground mt-1 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground mb-12">
        {(Object.keys(STATUS_LABEL) as FindingStatus[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${DOT_CLASSES[k]}`} />
            {STATUS_LABEL[k]}
          </span>
        ))}
      </div>

      {/* ── Urgent callout ───────────────────────────────────────── */}
      <div className="mb-16 p-6 rounded-2xl border border-red-600/30 bg-red-600/5">
        <h3 className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-base mb-3">
          <AlertTriangle className="w-5 h-5 shrink-0" /> {URGENT_CALLOUT.title}
        </h3>
        <div className="space-y-3">
          {URGENT_CALLOUT.body.map((p, i) => (
            <p key={i} className="text-sm text-foreground/90 leading-relaxed">{renderInlineMd(p)}</p>
          ))}
        </div>
      </div>

      {/* ── Sections ─────────────────────────────────────────────── */}
      {AUDIT_SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="mb-16 scroll-mt-24">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="font-mono text-xs text-primary font-bold">{section.number}</span>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">{section.title}</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl mb-8">{section.note}</p>

          <div className="divide-y divide-border">
            {section.findings.map((f) => (
              <div key={f.num} className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 md:gap-6 py-6">
                <div>
                  <span className="font-mono text-[11px] text-muted-foreground/70 block mb-1">{f.num}</span>
                  <span className="inline-block text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground mb-2">{f.priority}</span>
                  <h4 className="font-bold text-sm text-foreground mb-1">{f.title}</h4>
                  <p className="text-xs text-muted-foreground">{f.why}</p>
                </div>
                <div>
                  {f.entries.map((entry, i) => (
                    <div key={i} className={i > 0 ? 'mt-3' : ''}>
                      <StatusBadge status={entry.status} />
                      {entry.body.map((p, j) => (
                        <p key={j} className="text-sm text-foreground/90 leading-relaxed mb-2 last:mb-0">{renderInlineMd(p)}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* ── Shipped today ────────────────────────────────────────── */}
      <section id="shipped" className="scroll-mt-24">
        <h2 className="text-xl sm:text-2xl font-black text-foreground mb-2">What shipped alongside this audit</h2>
        <p className="text-sm text-muted-foreground max-w-2xl mb-8">Three pieces of platform-integration work outside the marketing site&apos;s own scope — the kind that requires touching backend services directly.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SHIPPED_TODAY.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">{s.tag}</p>
              <h4 className="font-bold text-sm text-foreground mb-2">{s.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
