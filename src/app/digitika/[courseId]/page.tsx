import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { findCourse } from '@/config/courses';
import { type DbCourse } from '@/types/course';
import { prisma } from '@/lib/db';
import { CourseDetailClient } from '@/components/digitika/CourseDetailClient';

// Rendered per-request so course data comes straight from the DB on the running
// pod (where Postgres is reachable). Avoids the previous build-time self-fetch to
// /api/courses, which baked stale 404s when the CI build couldn't reach the API.
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ courseId: string }>;
}

async function getCourse(courseId: string): Promise<DbCourse | null> {
  try {
    const course = await prisma.course.findFirst({
      where: { id: courseId, isActive: true },
    });
    return (course as unknown as DbCourse) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params;
  const dbCourse = await getCourse(courseId);
  if (!dbCourse) return { title: 'Course Not Found' };

  const found = findCourse(courseId);
  const category = found?.category;
  const title = `${dbCourse.shortName ?? dbCourse.name} | Digitika Academy`;
  const description = dbCourse.longDescription ?? dbCourse.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://codevertexitsolutions.com/digitika/${courseId}`,
      siteName: 'Codevertex Africa Limited',
      type: 'website',
      images: [
        {
          url: 'https://codevertexitsolutions.com/images/students.jpg',
          width: 1200,
          height: 630,
          alt: dbCourse.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    keywords: [
      'Digitika', 'Codevertex', category?.name ?? '', dbCourse.name, 'Kenya', 'Kisumu',
      'tech training', 'coding', 'certification',
    ],
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { courseId } = await params;

  // Fetch live DB data (name, price, installmentPlans, etc.)
  const dbCourse = await getCourse(courseId);
  if (!dbCourse) notFound();

  // Get static supplemental data (curriculum, testimonials, alumni) from config
  const found = findCourse(courseId);
  if (!found) notFound();

  const { category, course: staticCourse } = found;
  const staticData = {
    curriculum: staticCourse.curriculum,
    testimonials: staticCourse.testimonials,
    alumniCompanies: staticCourse.alumniCompanies,
    brochure: staticCourse.brochure,
    location: staticCourse.location,
    cohortSize: staticCourse.cohortSize,
    startDate: staticCourse.startDate,
  };

  return <CourseDetailClient course={dbCourse} category={category} staticData={staticData} />;
}
