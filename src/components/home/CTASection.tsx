import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SITE } from '@/lib/constants';

/** Closing call to action over a real field photo, shared by the home page and long pages. */
export function CTASection({
  title = 'Tell us how your business runs. We will show you the setup that fits.',
  lead = 'We demo at your premises or online, anywhere in Kenya and East Africa. Plans with a published price start with a 14-day free trial.',
}: {
  title?: string;
  lead?: string;
}) {
  return (
    <section className="bg-background px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="relative max-w-7xl mx-auto overflow-hidden rounded-4xl bg-night">
        <Image src="/images/photos/hackathon-team-table.webp" alt="" fill sizes="100vw" className="object-cover opacity-35" />
        <div className="absolute inset-0 bg-night/55" aria-hidden />
        <div className="relative grid gap-8 p-8 sm:p-12 lg:p-16 lg:grid-cols-12 lg:items-end text-night-foreground">
          <div className="lg:col-span-8">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight max-w-3xl">{title}</h2>
            <p className="mt-4 text-lg text-night-foreground/80 max-w-2xl">{lead}</p>
          </div>
          <div className="lg:col-span-4 flex flex-wrap gap-3 lg:justify-end">
            <Button size="lg" variant="gold" className="rounded-full px-7" asChild>
              <Link href="/contact">Book a demo</Link>
            </Button>
            <Button size="lg" variant="outline-light" className="rounded-full px-7 glass-dark" asChild>
              <a href={`tel:${SITE.phone1.replace(/\s/g, '')}`}>Call {SITE.phone1}</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
