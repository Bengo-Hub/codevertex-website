import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/site/Reveal';
import { formatProjectDate, type ProjectSummary } from '@/lib/projects-server';

const FIELD_PHOTOS = [
  { src: '/images/photos/field-anpr-install.webp', alt: 'Mounting a number-plate camera in front of Kanyonyo weighbridge station', caption: 'ANPR camera, Kanyonyo weighbridge' },
  { src: '/images/photos/field-cctv-mast.webp', alt: 'A Codevertex engineer aligning a camera on a mast', caption: 'Camera alignment on site' },
  { src: '/images/photos/weighbridge-demo.webp', alt: 'A weighbridge plate in use at the KeNHA stand, Mombasa show', caption: 'Weighbridge demo, Mombasa show' },
];

const SERVICES_ON_SITE = ['Number-plate (ANPR) cameras', 'Weighbridge displays and lane lights', 'CCTV and recorders', 'Networks and server racks', 'User training on site'];

/** Night section: the hardware side of the business and the latest published projects. */
export function FieldWorkSection({ projects }: { projects: ProjectSummary[] }) {
  return (
    <section id="field-work" aria-labelledby="field-heading" className="scroll-mt-20 bg-night text-night-foreground px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto">
        <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="text-sm font-semibold text-gold">Hardware and installation</p>
            <h2 id="field-heading" className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              We install the hardware too.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-night-foreground/75 text-lg leading-relaxed">
              Our own engineers fit the equipment our software talks to, then train the people who use it.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {SERVICES_ON_SITE.map((s) => (
                <li key={s} className="glass-dark rounded-full px-3 py-1 text-sm text-night-foreground/90">{s}</li>
              ))}
            </ul>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-3 md:grid-rows-2 md:h-[34rem]">
          {FIELD_PHOTOS.map((p, i) => (
            <Reveal key={p.src} as="figure" delay={i * 120} className={`relative overflow-hidden rounded-3xl bg-white/5 ${i === 0 ? 'md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto' : 'aspect-[4/3] md:aspect-auto'}`}>
              <Image src={p.src} alt={p.alt} fill sizes={i === 0 ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 100vw'} className="object-cover" />
              <figcaption className="glass-dark absolute left-3 bottom-3 rounded-full px-3 py-1 text-sm">{p.caption}</figcaption>
            </Reveal>
          ))}
        </div>

        {projects.length > 0 && (
          <div className="mt-16">
            <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <h3 className="font-display text-2xl sm:text-3xl font-bold">Recent projects</h3>
              <Link href="/projects" className="text-sm font-semibold text-gold hover:underline underline-offset-4">All projects</Link>
            </Reveal>
            <ul className="grid gap-5 md:grid-cols-3">
              {projects.slice(0, 3).map((p, i) => (
                <Reveal key={p.slug} as="li" delay={i * 120}>
                  <Link href={`/projects/${p.slug}`} className="group glass-dark block h-full overflow-hidden rounded-3xl">
                    <div className="relative aspect-[3/2] overflow-hidden bg-white/5">
                      {p.coverPhotoId && (
                        // eslint-disable-next-line @next/next/no-img-element -- photos are served from the database
                        <img src={`/api/projects/photos/${p.coverPhotoId}`} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-gold">{formatProjectDate(p.eventDate)}</p>
                      <p className="mt-1 font-semibold leading-snug">{p.title}</p>
                      <p className="mt-1 text-sm text-night-foreground/65">{p.venue}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-12 flex flex-wrap gap-3">
          <Button variant="gold" className="rounded-full" asChild><Link href="/contact?service=iot">Plan an installation</Link></Button>
          <Button variant="outline-light" className="rounded-full" asChild><Link href="/integrations">What we integrate</Link></Button>
        </div>
      </div>
    </section>
  );
}
