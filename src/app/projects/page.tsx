import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Images, MapPin } from 'lucide-react';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Projects & Events',
  description: 'Meetings, events and projects Codevertex Africa has taken part in — with photos, venues and highlights.',
};

// Rendered per-request: the build stage has no live DATABASE_URL (same reason as /blog).
export const dynamic = 'force-dynamic';

function formatDate(d: Date) {
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function ProjectsPage() {
  const events = await prisma.projectEvent.findMany({
    where: { published: true },
    orderBy: { eventDate: 'desc' },
    include: {
      photos: { select: { id: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
    },
  });

  return (
    <div className="pt-20">
      <section className="bg-foreground pt-20 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-100 h-75 bg-primary/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Projects &amp; events</p>
          <h1 className="text-5xl sm:text-6xl font-black text-white dark:text-foreground tracking-tight leading-[1.05] mb-4">
            Where we show up
          </h1>
          <p className="text-white/70 dark:text-muted-foreground text-lg max-w-xl leading-relaxed">
            Meetings, hackathons and partner events we take part in — in pictures.
          </p>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {events.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Images className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No events to show yet — check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((e) => (
                <Link
                  key={e.id.toString()}
                  href={`/projects/${e.slug}`}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors flex flex-col"
                >
                  <div className="relative h-52 bg-muted overflow-hidden">
                    {e.photos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/projects/photos/${e.photos[0].id}`}
                        alt={e.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground"><Images className="h-7 w-7 opacity-40" /></div>
                    )}
                    {e.photos.length > 1 && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[11px] font-semibold flex items-center gap-1">
                        <Images className="h-3 w-3" /> {e.photos.length}
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h2 className="font-bold text-foreground text-lg leading-snug group-hover:text-primary transition-colors">{e.title}</h2>
                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" />{e.venue}</p>
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 shrink-0" />{formatDate(e.eventDate)}</p>
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-3 leading-relaxed">{e.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
