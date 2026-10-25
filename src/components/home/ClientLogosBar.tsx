import type { ClientTenant } from '@/lib/tenants';

/** Live customers with a logo, from auth-api's marketplace (see lib/tenants.ts), as a slow strip. */
export function ClientLogosBar({ tenants }: { tenants: ClientTenant[] }) {
  if (tenants.length === 0) return null;
  // Three copies so the loop never shows a gap; the copies are hidden from screen readers.
  const items = [...tenants, ...tenants, ...tenants];

  return (
    <section aria-labelledby="customers-heading" className="bg-background py-10 border-b border-border overflow-hidden">
      <h2 id="customers-heading" className="text-center text-sm font-semibold text-muted-foreground mb-6 px-4">
        Trusted by businesses across Kenya
      </h2>
      <div className="[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <ul className="flex w-max gap-4 animate-marquee">
          {items.map((t, i) => (
            <li
              key={`${t.slug}-${i}`}
              aria-hidden={i >= tenants.length || undefined}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 shadow-soft"
              title={`${t.name}, ${t.useCase}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- tenant-hosted or data-URI logos */}
              <img src={t.logoUrl} alt={i < tenants.length ? t.name : ''} className="h-9 w-9 object-contain" loading="lazy" />
              <span className="whitespace-nowrap">
                <span className="block text-sm font-semibold text-foreground">{t.name}</span>
                <span className="block text-xs text-muted-foreground">{t.useCase}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
