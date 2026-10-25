import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatProjectDate, type ProjectSummary } from '@/lib/projects-server';

const FIELD_PHOTOS = [
  { src: '/images/photos/field-anpr-install.webp', alt: 'Mounting a number-plate camera in front of Kanyonyo weighbridge station', caption: 'ANPR camera, Kanyonyo weighbridge' },
  { src: '/images/photos/field-cctv-mast.webp', alt: 'A Codevertex engineer aligning a camera on a mast', caption: 'Aligning a camera on its mast' },
  { src: '/images/photos/network-rack.webp', alt: 'A network rack installed and cabled by the Codevertex team', caption: 'Network rack, cabled and labelled' },
];

/**
 * Night section on the home page: the hardware side of the business (cameras, weighbridges,
 * networks), and the latest published projects from the database.
 */
export function FieldWorkSection({ projects }: { projects: ProjectSummary[] }) {
  return (
    <section aria-labelledby="field-heading" className="bg-night text-night-foreground px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end mb-12">
          <h2 id="field-heading" className="lg:col-span-7 font-display text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            We install the hardware too.
          </h2>
          <p className="lg:col-span-5 text-night-foreground/75 text-lg leading-relaxed">
            Our field team fits the number-plate cameras, weighbridge displays, CCTV and networks our software talks
            to, and trains the people who use them.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {FIELD_PHOTOS.map((p, i) => (
            <figure key={p.src} className={i === 0 ? 'md:col-span-2' : ''}>
              <div className={`relative overflow-hidden rounded-md bg-white/5 ${i === 0 ? 'aspect-12/5' : 'aspect-6/5 md:aspect-auto md:h-full md:min-h-60'}`}>
                <Image src={p.src} alt={p.alt} fill sizes={i === 0 ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 100vw'} className="object-cover" />
              </div>
              <figcaption className="mt-2 text-sm text-night-foreground/65">{p.caption}</figcaption>
            </figure>
          ))}
        </div>

        {projects.length > 0 && (
          <div className="mt-16">
            <h3 className="font-display text-2xl font-bold mb-6">Recent projects</h3>
            <ul className="grid gap-6 md:grid-cols-3">
              {projects.slice(0, 3).map((p) => (
                <li key={p.slug}>
                  <Link href={`/projects/${p.slug}`} className="group block">
                    <div className="relative aspect-3/2 overflow-hidden rounded-md bg-white/5">
                      {p.coverPhotoId && (
                        // eslint-disable-next-line @next/next/no-img-element -- photos are served from the database
                        <img src={`/api/projects/photos/${p.coverPhotoId}`} alt="" loading="lazy" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <p className="mt-3 text-sm text-gold">{formatProjectDate(p.eventDate)}</p>
                    <p className="mt-1 font-semibold leading-snug group-hover:underline underline-offset-4">{p.title}</p>
                    <p className="mt-1 text-sm text-night-foreground/65">{p.venue}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-12 flex flex-wrap gap-3">
          <Button variant="gold" asChild><Link href="/projects">See all projects</Link></Button>
          <Button variant="outline-light" asChild><Link href="/integrations">Hardware we integrate</Link></Button>
        </div>
      </div>
    </section>
  );
}
