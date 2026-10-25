import { cn } from '@/lib/utils';

/**
 * The opening block of every public page: a plain headline and one lead paragraph, left
 * aligned, with an optional block (actions or an image) beside it on wide screens.
 */
export function PageIntro({
  title,
  lead,
  children,
  aside,
  className,
}: {
  title: React.ReactNode;
  lead?: React.ReactNode;
  children?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('border-b border-border bg-background pt-28 lg:pt-36 pb-12 lg:pb-16 px-4 sm:px-6 lg:px-8', className)}>
      <div className={cn('max-w-7xl mx-auto', aside && 'grid gap-10 lg:grid-cols-12 lg:items-end')}>
        <div className={cn(aside && 'lg:col-span-7')}>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.05] max-w-3xl">
            {title}
          </h1>
          {lead && <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-2xl text-pretty">{lead}</p>}
          {children && <div className="mt-8">{children}</div>}
        </div>
        {aside && <div className="lg:col-span-5">{aside}</div>}
      </div>
    </section>
  );
}
