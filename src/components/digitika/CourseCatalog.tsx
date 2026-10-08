import { Suspense } from 'react';
import { COURSE_CATEGORIES, getCategory, type CourseCategory } from '@/config/courses';
import { prisma } from '@/lib/db';
import { CourseCatalogClient, type CatalogCourse } from './CourseCatalogClient';

async function fetchCourses(): Promise<CatalogCourse[]> {
  try {
    // Query the DB directly (server component) rather than self-fetching /api/courses.
    // Cards never render page-only content, so only the age range is lifted out of metadata.
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }],
    });
    return courses.map(({ metadata, createdAt: _c, updatedAt: _u, ...c }) => ({
      ...(c as unknown as Omit<CatalogCourse, 'ageRange'>),
      ageRange: (metadata as { ageRange?: string } | null)?.ageRange || undefined,
    }));
  } catch {
    return [];
  }
}

export async function CourseCatalog() {
  const courses = await fetchCourses();

  // Configured categories first (display order), then any categoryId an admin created
  // without display config, so no active course is ever hidden. Empty categories are dropped.
  const used = new Set(courses.map((c) => c.categoryId));
  const known = new Set(COURSE_CATEGORIES.map((c) => c.id));
  const categories: CourseCategory[] = [
    ...COURSE_CATEGORIES.filter((c) => used.has(c.id)),
    ...[...used].filter((id) => !known.has(id)).map(getCategory),
  ];

  return (
    <section id="courses" className="scroll-mt-20 py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Course catalog</p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Find the right programme</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            {courses.length} courses for adults, teens and kids. Search, filter by level, format, duration or price, or browse by category.
          </p>
        </div>
        {/* useSearchParams() needs a Suspense boundary */}
        <Suspense fallback={<div className="h-96 rounded-2xl bg-muted/40 animate-pulse" />}>
          <CourseCatalogClient courses={courses} categories={categories} />
        </Suspense>
      </div>
    </section>
  );
}
