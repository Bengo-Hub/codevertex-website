import { randomInt } from 'node:crypto';
import { prisma } from '@/lib/db';

function generateStudentId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'DGT-';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(randomInt(chars.length)); // CSPRNG: the ID is the parent-portal lookup key
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
export interface InstallmentLike {
  installmentNo: number;
  amount: number;
  dueDate: Date;
  status: string;
}

/**
 * Single source for "how much is paid / owed" on an enrollment. Used by the receipt
 * summary and the parent portal so both always agree. Paid = sum of paid installment
 * rows; an upfront enrollment (no rows) counts its first payment once it succeeded.
 */
export function summarizeEnrollmentPayments(
  enrollment: { amount: number; totalAmount: number | null; paymentStatus: string },
  installments: InstallmentLike[],
  now: Date = new Date(),
) {
  const totalAmount = enrollment.totalAmount ?? enrollment.amount;
  const paidFromInstallments = installments.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const amountPaid =
    paidFromInstallments || (ACTIVE_ENROLLMENT_STATUSES.includes(enrollment.paymentStatus) ? enrollment.amount : 0);
  const unpaid = installments.filter((i) => i.status !== 'paid');
  const overdue = unpaid.filter((i) => i.dueDate < now);
  return {
    totalAmount,
    amountPaid,
    remainingBalance: Math.max(0, totalAmount - amountPaid),
    nextDue: unpaid[0] ?? null,
    overdueAmount: overdue.reduce((s, i) => s + i.amount, 0),
    overdueCount: overdue.length,
  };
}
