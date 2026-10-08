import type { Metadata } from 'next';
import { DigitikaHero } from '@/components/digitika/DigitikaHero';
import { AlumniBar } from '@/components/digitika/AlumniBar';
import { LifeAtDigitika } from '@/components/digitika/LifeAtDigitika';
import { TestimonialsSection } from '@/components/digitika/TestimonialsSection';
import { CourseCatalog } from '@/components/digitika/CourseCatalog';
import { COURSE_CATEGORIES } from '@/config/courses';
import { prisma } from '@/lib/db';

// Render at request time so the catalog reads courses from the DB on the running
// pod, rather than baking an empty list at build time.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Digitika Academy — Tech Education',
  description: 'Industry-aligned certification programmes in software engineering, AI, networking, data analytics, and ICDL. Enroll from Kisumu or online.',
  openGraph: {
    title: 'Digitika Academy | Codevertex Africa Limited',
    description: "Closing Africa's digital skills gap. Courses in coding, AI, networking, and data analytics.",
    url: 'https://codevertexafrica.com/digitika',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'Digitika Academy by Codevertex Africa Limited' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digitika Academy | Codevertex Africa Limited',
    description: "Closing Africa's digital skills gap. Courses in coding, AI, networking, and data analytics.",
    images: ['/images/og-image.png'],
  },
};

async function catalogCounts(): Promise<{ courseCount: number; categoryCount: number }> {
  try {
    const rows = await prisma.course.groupBy({ by: ['categoryId'], where: { isActive: true }, _count: { _all: true } });
    return { courseCount: rows.reduce((s, r) => s + r._count._all, 0), categoryCount: rows.length };
  } catch {
    return { courseCount: 0, categoryCount: COURSE_CATEGORIES.length };
  }
}

export default async function DigitikaPage() {
  const counts = await catalogCounts();
  return (
    <>
      <DigitikaHero {...counts} />
      <AlumniBar />
      {/* Catalog right under the hero: browsing courses is the main job of this page */}
      <CourseCatalog />
      <LifeAtDigitika />
      <TestimonialsSection />
    </>
  );
}
