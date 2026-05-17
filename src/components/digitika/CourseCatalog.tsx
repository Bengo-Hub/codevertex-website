import { COURSE_CATEGORIES } from '@/config/courses';
import { type DbCourse } from '@/types/course';
import { CourseCard } from './CourseCard';

async function fetchCourses(): Promise<DbCourse[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/courses`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Failed to fetch courses');
    return res.json();
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

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-16">
        {COURSE_CATEGORIES.map(cat => {
          const courses = coursesByCategory.get(cat.id) ?? [];
          if (courses.length === 0) return null;
          return (
            <div key={cat.id} id={cat.id}>
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
