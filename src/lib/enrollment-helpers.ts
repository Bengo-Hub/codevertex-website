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

const ACTIVE_ENROLLMENT_STATUSES = new Set(['succeeded', 'paid']);

/** True if this email already has a confirmed (paid/succeeded) enrollment in this course. */
export async function hasActiveEnrollment(email: string, courseId: string): Promise<boolean> {
  const existing = await prisma.enrollment.findFirst({
    where: { email, courseId },
    orderBy: { createdAt: 'desc' },
  });
  return Boolean(existing && ACTIVE_ENROLLMENT_STATUSES.has(existing.paymentStatus));
}
