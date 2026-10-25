import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { prisma } from '@/lib/db';
import { ProjectGallery } from '@/components/projects/ProjectGallery';
import { formatProjectDate } from '@/lib/projects-server';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProject(slug: string) {
  return prisma.projectEvent.findFirst({
    where: { slug, published: true },
    include: { photos: { select: { id: true, caption: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] } },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: 'Project not found' };
  const description = project.description.slice(0, 160);
  return {
    title: project.title,
    description,
    openGraph: {
      title: project.title,
      description,
      images: project.photos[0] ? [`/api/projects/photos/${project.photos[0].id}`] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  return (
    <article className="bg-background px-4 sm:px-6 lg:px-8 pt-28 lg:pt-36 pb-20">
      <div className="max-w-5xl mx-auto">
        <Link href="/projects" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline underline-offset-4">
          <ChevronLeft className="h-4 w-4" aria-hidden /> All projects
        </Link>

        <h1 className="mt-6 font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">{project.title}</h1>
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div><dt className="sr-only">Where</dt><dd className="text-muted-foreground">{project.venue}</dd></div>
          <div><dt className="sr-only">When</dt><dd className="text-muted-foreground">{formatProjectDate(project.eventDate)}</dd></div>
        </dl>

        <div className="mt-8 max-w-3xl space-y-4 text-lg text-foreground/85 leading-relaxed">
          {project.description.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
        </div>

        {project.photos.length > 0 && (
          <div className="mt-12">
            <ProjectGallery title={project.title} photos={project.photos.map((p) => ({ id: p.id.toString(), caption: p.caption }))} />
          </div>
        )}
      </div>
    </article>
  );
}
