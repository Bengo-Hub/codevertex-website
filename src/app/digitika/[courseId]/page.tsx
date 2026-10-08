import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCategory } from '@/config/courses';
import { type DbCourse } from '@/types/course';
import { prisma } from '@/lib/db';
import { CourseDetailClient } from '@/components/digitika/CourseDetailClient';
import { JsonLd, courseJsonLd } from '@/lib/json-ld';

// Rendered per-request so course data comes straight from the DB on the running
// pod (where Postgres is reachable). Avoids the previous build-time self-fetch to
// /api/courses, which baked stale 404s when the CI build couldn't reach the API.
export const dynamic = 'force-dynamic';

const SITE_URL = 'https://codevertexafrica.com';

interface Props {
  params: Promise<{ courseId: string }>;
}

// The DB row is the single source of truth for every section of the course page
// (including curriculum, testimonials, brochure etc. in Course.metadata), so anything
// an admin edits in /admin/courses shows here on the next request.
// cache() dedupes the lookup between generateMetadata() and the page render.
const getCourse = cache(async (courseId: string): Promise<DbCourse | null> => {
  try {
    const course = await prisma.course.findFirst({
      where: { id: courseId, isActive: true },
    });
    return (course as unknown as DbCourse) ?? null;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params;
  const dbCourse = await getCourse(courseId);
  if (!dbCourse) return { title: 'Course Not Found' };

  const category = getCategory(dbCourse.categoryId);
  const title = `${dbCourse.shortName ?? dbCourse.name} | Digitika Academy`;
  const description = dbCourse.description;
  const image = dbCourse.coverImage
    ? new URL(dbCourse.coverImage, SITE_URL).toString()
    : `${SITE_URL}/images/students.jpg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/digitika/${courseId}`,
      siteName: 'Codevertex Africa Limited',
      type: 'website',
      images: [{ url: image, width: 1200, height: 630, alt: dbCourse.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    keywords: [
      'Digitika', 'Codevertex', category.name, dbCourse.name, 'Kenya', 'Kisumu',
      'tech training', 'coding', 'certification',
      ...(dbCourse.categoryId === 'kids' ? ['kids coding', 'robotics for kids', 'holiday bootcamp', 'CBC'] : []),
    ],
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { courseId } = await params;
  const dbCourse = await getCourse(courseId);
  if (!dbCourse) notFound();

  return (
    <>
      <JsonLd
        data={courseJsonLd({
          id: dbCourse.id,
          name: dbCourse.name,
          description: dbCourse.longDescription ?? dbCourse.description,
          price: dbCourse.price,
          duration: dbCourse.duration,
        })}
      />
      <CourseDetailClient course={dbCourse} category={getCategory(dbCourse.categoryId)} />
    </>
  );
}
