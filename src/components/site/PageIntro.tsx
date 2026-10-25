import { cn } from '@/lib/utils';

/**
 * The opening block of every public page, on the soft mist surface. With an `aside` (an image
 * or a card) the text and the aside sit side by side, vertically centred. Without one, the title
 * and the lead share the width so the block never leaves a half-empty row.
 */
export function PageIntro({
  title,
  lead,
  eyebrow,
  children,
  aside,
  className,
}: {
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** Short context line above the title, e.g. the section of the site. */
  eyebrow?: React.ReactNode;
  children?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  const heading = (
    <>
      {eyebrow && <p className="text-sm font-semibold text-primary mb-3">{eyebrow}</p>}
      <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">{title}</h1>
    </>
  );

  return (
    <section className={cn('bg-mist px-4 sm:px-6 lg:px-8 pt-24 lg:pt-28 pb-10 lg:pb-14', className)}>
      {aside ? (
        <div className="max-w-7xl mx-auto grid gap-8 lg:gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            {heading}
            {lead && <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-2xl text-pretty">{lead}</p>}
            {children && <div className="mt-7">{children}</div>}
          </div>
          <div className="lg:col-span-5">{aside}</div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid gap-5 lg:gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">{heading}</div>
          <div className="lg:col-span-5">
            {lead && <p className="text-lg text-muted-foreground leading-relaxed text-pretty">{lead}</p>}
            {children && <div className={cn(lead && 'mt-6')}>{children}</div>}
          </div>
        </div>
      )}
    </section>
  );
}

/** A rounded photo for a PageIntro aside. */
export function IntroImage({ children }: { children: React.ReactNode }) {
  return <div className="relative aspect-[4/3] overflow-hidden rounded-4xl shadow-lift">{children}</div>;
}
