import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { COURSE_CATEGORIES, findCourse } from '@/config/courses';
import { type DbCourse } from '@/types/course';
import { CourseDetailClient } from '@/components/digitika/CourseDetailClient';

interface Props {
  params: Promise<{ courseId: string }>;
}

async function fetchCourse(courseId: string): Promise<DbCourse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/courses/${courseId}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  return COURSE_CATEGORIES.flatMap(cat =>
    cat.courses.map(course => ({ courseId: course.id }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params;
  const dbCourse = await fetchCourse(courseId);
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
  const dbCourse = await fetchCourse(courseId);
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
