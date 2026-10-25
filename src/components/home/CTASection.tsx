import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SITE } from '@/lib/constants';

/** Closing call to action, shared by the home page and other long pages. */
export function CTASection({
  title = 'Tell us how your business runs. We will show you the setup that fits.',
  lead = 'We demo on site in Kisumu or online. Plans with a published price start with a 14-day free trial.',
}: {
  title?: string;
  lead?: string;
}) {
  return (
    <section className="bg-night text-night-foreground px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight max-w-3xl">{title}</h2>
          <p className="mt-5 text-lg text-night-foreground/75 max-w-2xl">{lead}</p>
        </div>
        <div className="lg:col-span-4 flex flex-wrap gap-3 lg:justify-end">
          <Button size="lg" variant="gold" asChild>
            <Link href="/contact">Book a demo</Link>
          </Button>
          <Button size="lg" variant="outline-light" asChild>
            <a href={`tel:${SITE.phone2.replace(/\s/g, '')}`}>Call {SITE.phone2}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
