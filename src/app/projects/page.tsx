import type { Metadata } from 'next';
import Link from 'next/link';
import { PageIntro } from '@/components/site/PageIntro';
import { CTASection } from '@/components/home/CTASection';
import { formatProjectDate, listPublishedProjects } from '@/lib/projects-server';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Installations, system rollouts and training Codevertex Africa Limited has delivered, with photos from each site.',
};

// Rendered per request: the build stage has no live DATABASE_URL (same as /blog).
export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await listPublishedProjects();

  return (
    <>
      <PageIntro
        title="Projects"
        lead="Cameras at weighbridges, systems in libraries, training for officers and students. Here is the work, with photos from each site."
      />

      <section className="bg-background px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          {projects.length === 0 ? (
            <p className="py-16 text-muted-foreground">Projects will appear here as soon as they are published.</p>
          ) : (
            <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <li key={p.slug}>
                  <Link href={`/projects/${p.slug}`} className="group block">
                    <div className="relative aspect-3/2 overflow-hidden rounded-3xl bg-muted shadow-soft">
                      {p.coverPhotoId && (
                        // eslint-disable-next-line @next/next/no-img-element -- photos are served from the database
                        <img src={`/api/projects/photos/${p.coverPhotoId}`} alt="" loading="lazy" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {formatProjectDate(p.eventDate)}
                      {p.photoCount > 1 && <span> · {p.photoCount} photos</span>}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-bold text-foreground leading-snug group-hover:text-primary">{p.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{p.venue}</p>
                    <p className="mt-3 text-[15px] text-foreground/80 leading-relaxed line-clamp-3">{p.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <CTASection title="Have a site that needs the same?" lead="Tell us about the equipment, the people and the software involved, and we will plan it with you." />
    </>
  );
}
