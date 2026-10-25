import type { ClientTenant } from '@/lib/tenants';

/** Live customers with a logo, from auth-api's marketplace (see lib/tenants.ts). */
export function ClientLogosBar({ tenants }: { tenants: ClientTenant[] }) {
  if (tenants.length === 0) return null;

  return (
    <section aria-labelledby="customers-heading" className="border-y border-border bg-secondary px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <h2 id="customers-heading" className="text-base font-semibold text-foreground mb-6">
          Businesses running on Codevertex
        </h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {tenants.slice(0, 10).map((t) => (
            <li key={t.slug} className="flex items-center gap-3 rounded-md bg-background border border-border px-4 py-3" title={`${t.name}, ${t.useCase}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- tenant-hosted or data-URI logos */}
              <img src={t.logoUrl} alt="" className="h-9 w-9 shrink-0 object-contain" loading="lazy" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground truncate">{t.name}</span>
                <span className="block text-xs text-muted-foreground truncate">{t.useCase}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
