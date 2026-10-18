import { randomInt } from 'node:crypto';
import { prisma } from '@/lib/db';
import { ACTIVE_ENROLLMENT_STATUSES } from '@/lib/learner-rules';

function generateStudentId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'DGT-';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(randomInt(chars.length)); // CSPRNG: the ID is the parent-portal lookup key
  }
  return id;
}

/**
 * The student record for an email, whatever case it was typed in. Rows from before emails were
 * lowercased can hold capitals, so an exact miss falls back to a case-insensitive match.
 */
export async function findStudentByEmail(email: string) {
  const normalised = email.trim().toLowerCase();
  return (
    (await prisma.studentUser.findUnique({ where: { email: normalised } })) ??
    (await prisma.studentUser.findFirst({ where: { email: { equals: normalised, mode: 'insensitive' } } }))
  );
}

// Age rules live in learner-rules (pure); re-exported for the routes that import from here.
export { isUnder18 } from '@/lib/learner-rules';

export interface GuardianInput {
  name: string;
  email: string;
  phone: string;
}

/**
 * Find a StudentUser by email, or create one with a fresh unique DGT- id. A guardian given
 * on a later enrollment replaces the one on record (the newest details win).
 */
export async function upsertStudentUser(input: {
  email: string;
  fullName: string;
  phone: string;
  dob?: string | null;
  guardian?: GuardianInput;
}) {
  const guardianData = input.guardian
    ? {
        guardianName: input.guardian.name.trim() || null,
        guardianEmail: input.guardian.email.trim().toLowerCase(),
        guardianPhone: input.guardian.phone.trim() || null,
      }
    : {};
  // Stored lowercased so it matches the SSO account (auth-api lowercases emails).
  const email = input.email.trim().toLowerCase();
  const existing = await findStudentByEmail(email);
  if (existing) {
    // A date of birth is only ever filled in, never overwritten by a later enrollment.
    const dobData = !existing.dob && input.dob ? { dob: new Date(input.dob) } : {};
    if (!input.guardian && !('dob' in dobData)) return existing;
    // A different guardian needs their own parent account, so the old link is dropped.
    const guardianChanged = !!input.guardian && existing.guardianEmail !== guardianData.guardianEmail;
    return prisma.studentUser.update({
      where: { id: existing.id },
      data: { ...dobData, ...guardianData, ...(guardianChanged ? { guardianSsoUserId: null } : {}) },
    });
  }

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
      email,
      fullName: input.fullName,
      phone: input.phone,
      dob: input.dob ? new Date(input.dob) : null,
      ...guardianData,
    },
  });
}

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
// Payment summary moved to the pure installments module so client components can use it too.
export { summarizeEnrollmentPayments, type InstallmentLike } from '@/lib/installments';
