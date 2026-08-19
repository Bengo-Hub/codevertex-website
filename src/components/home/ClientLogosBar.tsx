import { fetchShowcaseTenants } from '@/lib/tenants';

export async function ClientLogosBar() {
  const tenants = await fetchShowcaseTenants();
  if (tenants.length === 0) return null;

  // Triple the list so the seamless loop always has content in view.
  const items = [...tenants, ...tenants, ...tenants];

  return (
    <section className="py-10 border-b border-border bg-card overflow-hidden">
      <p className="text-xs font-bold uppercase tracking-widest text-center text-muted-foreground mb-6 px-4">
        Real businesses running on Codevertex
      </p>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-20 bg-linear-to-r from-card to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-linear-to-l from-card to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee gap-5 w-max">
          {items.map((t, i) => (
            <div
              key={`${t.slug}-${i}`}
              className="flex flex-col items-center justify-center w-48 h-28 rounded-xl bg-background border border-border px-4 py-3 shrink-0 hover:border-primary/30 transition-colors duration-200"
              title={t.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary tenant-hosted/data-URI logos, not a next/image-friendly source */}
              <img src={t.logoUrl} alt={t.name} className="h-8 w-auto max-w-[120px] object-contain" />
              <span className="mt-2 text-xs font-bold text-foreground text-center leading-tight line-clamp-1">{t.name}</span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.useCase}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
