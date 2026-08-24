import { prisma } from '@/lib/db';

function generateStudentId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'DGT-';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/** Find a StudentUser by email, or create one with a fresh unique DGT- id. */
export async function upsertStudentUser(input: {
  email: string;
  fullName: string;
  phone: string;
  dob?: string | null;
}) {
  const existing = await prisma.studentUser.findUnique({ where: { email: input.email } });
  if (existing) return existing;

  let studentId = generateStudentId();
  let attempts = 0;
  while (attempts < 5) {
    const collision = await prisma.studentUser.findUnique({ where: { id: studentId } });
    if (!collision) break;
    studentId = generateStudentId();
    attempts++;
  }

  return prisma.studentUser.create({
    data: {
      id: studentId,
      email: input.email,
      fullName: input.fullName,
      phone: input.phone,
      dob: input.dob ? new Date(input.dob) : null,
    },
  });
}

const ACTIVE_ENROLLMENT_STATUSES = ['succeeded', 'paid'];
/**
 * True if this email has ANY confirmed (paid/succeeded) enrollment in this course —
 * checked across every row, not just the most recent. A student who abandons
 * checkout and retries ends up with multiple enrollment rows for the same course;
 * only looking at the newest one meant a still-pending retry could mask an
 * already-paid earlier attempt and let a duplicate enrollment through.
 */
export async function hasActiveEnrollment(email: string, courseId: string): Promise<boolean> {
  const existing = await prisma.enrollment.findFirst({
    where: { email, courseId, paymentStatus: { in: ACTIVE_ENROLLMENT_STATUSES } },
  });
  return Boolean(existing);
}