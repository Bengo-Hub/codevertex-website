import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export interface CourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  percent: number;
  lastActivityAt: Date | null;
}

/**
 * Lesson completion per course for one student, in ONE grouped query (lessons joined to
 * modules, left-joined to that student's progress rows). Cost scales with the number of
 * lessons in the requested courses, never with total platform activity, and uses the
 * lesson_progress (lesson_id, student_user_id) unique index.
 * Shared by the student dashboard and the parent portal.
 */
export async function getCourseProgress(studentId: string, courseIds: string[]): Promise<Map<string, CourseProgress>> {
  const result = new Map<string, CourseProgress>();
  if (courseIds.length === 0) return result;

  const rows = await prisma.$queryRaw<
    { course_id: string; total: bigint; completed: bigint; last_activity: Date | null }[]
  >(Prisma.sql`
    SELECT m.course_id,
           COUNT(l.id)              AS total,
           COUNT(lp.completed_at)   AS completed,
           MAX(lp.updated_at)       AS last_activity
    FROM course_modules m
    JOIN lessons l ON l.module_id = m.id
    LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.student_user_id = ${studentId}
    WHERE m.course_id IN (${Prisma.join(courseIds)})
    GROUP BY m.course_id
  `);

  for (const courseId of courseIds) {
    result.set(courseId, { courseId, totalLessons: 0, completedLessons: 0, percent: 0, lastActivityAt: null });
  }
  for (const r of rows) {
    const total = Number(r.total);
    const completed = Number(r.completed);
    result.set(r.course_id, {
      courseId: r.course_id,
      totalLessons: total,
      completedLessons: completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      lastActivityAt: r.last_activity,
    });
  }
  return result;
}
