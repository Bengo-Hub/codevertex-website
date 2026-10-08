import { COURSE_CATEGORIES, getCategory } from '@/config/courses';
import { type DbCourse } from '@/types/course';
import { prisma } from '@/lib/db';
import { CourseCard } from './CourseCard';

async function fetchCourses(): Promise<DbCourse[]> {
  try {
    // Query the DB directly (server component) rather than self-fetching /api/courses.
    // The self-fetch failed during the CI build and rendered an empty catalog.
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      // Cards never render page-only content, so skip the metadata JSON payload.
      omit: { metadata: true },
      orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }],
    });
    return courses as unknown as DbCourse[];
  } catch {
    return [];
  }
}

export async function CourseCatalog() {
  const dbCourses = await fetchCourses();

  // Group courses by categoryId, preserving category order from config
  const coursesByCategory = new Map<string, DbCourse[]>();
  for (const course of dbCourses) {
    const list = coursesByCategory.get(course.categoryId) ?? [];
    list.push(course);
    coursesByCategory.set(course.categoryId, list);
  }

  // Configured categories first (in their display order), then any categoryId an admin
  // created that has no display config yet, so no active course is ever hidden.
  const known = new Set(COURSE_CATEGORIES.map((c) => c.id));
  const categories = [
    ...COURSE_CATEGORIES,
    ...[...coursesByCategory.keys()].filter((id) => !known.has(id)).map(getCategory),
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-16">
        {categories.map(cat => {
          const courses = coursesByCategory.get(cat.id) ?? [];
          if (courses.length === 0) return null;
          return (
            <div key={cat.id} id={cat.id} className="scroll-mt-24">
              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: cat.color }}>
                  {cat.tagline}
                </p>
                <h2 className="text-3xl font-black text-foreground tracking-tight">{cat.name}</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl">{cat.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {courses.map(course => (
                  <CourseCard key={course.id} course={course} category={cat} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
