import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { prisma } from '@/lib/db';
import { ProjectGallery } from '@/components/projects/ProjectGallery';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getEvent(slug: string) {
  return prisma.projectEvent.findFirst({
    where: { slug, published: true },
    include: { photos: { select: { id: true, caption: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] } },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: 'Event not found' };
  const description = event.description.slice(0, 160);
  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      images: event.photos[0] ? [`/api/projects/photos/${event.photos[0].id}`] : undefined,
    },
  };
}

export default async function ProjectEventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  return (
    <div className="pt-20">
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline mb-6">
            <ArrowLeft className="h-4 w-4" /> All projects &amp; events
          </Link>

          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">{event.title}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.venue}</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {event.eventDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <p className="mt-6 text-base text-muted-foreground leading-relaxed whitespace-pre-line max-w-3xl">{event.description}</p>

          {event.photos.length > 0 && (
            <div className="mt-10">
              <ProjectGallery
                title={event.title}
                photos={event.photos.map((p) => ({ id: p.id.toString(), caption: p.caption }))}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
