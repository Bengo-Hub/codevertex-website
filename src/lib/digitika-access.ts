import { prisma } from '@/lib/db';

const PAID_STATUSES = new Set(['succeeded', 'paid']);

/**
 * Resolves a student by their public Student ID (DGT-XXXXXXXX) and checks they
 * have a paid enrollment for the given course. Mirrors the lookup used by
 * /api/students/[studentId]/enrollment — no password, matching the existing
 * low-friction Digitika student-portal pattern (see docs/integrations.md §3,
 * "the marketing website does not enforce authentication").
 *
 * KNOWN LIMITATION carried over from that existing pattern: knowing a Student ID
 * is sufficient to view content. That's an acceptable bar for viewing your own
 * installment schedule, but worth revisiting (e.g. email OTP, or the planned
 * auth-service JWKS integration in docs/integrations.md §3) before this gates
 * real paid video content at scale.
 */
export async function resolvePaidAccess(studentId: string, courseId: string) {
  const sid = studentId.trim().toUpperCase();

  const student = await prisma.studentUser.findUnique({ where: { id: sid } });
  if (!student) return { student: null, enrollment: null, hasAccess: false };

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentUserId: sid, courseId },
    orderBy: { createdAt: 'desc' },
  });

  const hasAccess = Boolean(enrollment && PAID_STATUSES.has(enrollment.paymentStatus));
  return { student, enrollment, hasAccess };
}
