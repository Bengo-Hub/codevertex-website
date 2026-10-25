import { prisma } from '@/lib/db';

// Server-side reads of published projects for /projects and the home page. A list needs only
// the cover photo and a photo count, never every photo row, so the query stays small however
// many photos a project collects.

export interface ProjectSummary {
  slug: string;
  title: string;
  venue: string;
  description: string;
  eventDate: Date;
  coverPhotoId: string | null;
  photoCount: number;
}

export async function listPublishedProjects(limit = 60): Promise<ProjectSummary[]> {
  try {
    const rows = await prisma.projectEvent.findMany({
      where: { published: true },
      orderBy: { eventDate: 'desc' },
      take: limit,
      select: {
        slug: true,
        title: true,
        venue: true,
        description: true,
        eventDate: true,
        photos: { select: { id: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], take: 1 },
        _count: { select: { photos: true } },
      },
    });
    return rows.map(({ photos, _count, ...p }) => ({
      ...p,
      coverPhotoId: photos[0]?.id.toString() ?? null,
      photoCount: _count.photos,
    }));
  } catch {
    // Database unreachable (build stage): the page renders without projects.
    return [];
  }
}

export function formatProjectDate(d: Date) {
  return d.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
}
