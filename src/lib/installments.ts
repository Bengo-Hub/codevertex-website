/**
 * Digitika payment schedules: one place that turns a course, a chosen plan and a total into
 * the exact payments and due dates. The checkout modal uses it to show the schedule, and
 * POST /api/enrollments plus the admin enrollment route use it to build the rows, so the
 * server never trusts amounts or dates sent by the browser.
 *
 * Two kinds of plan:
 *   - preset plans the admin defines per course (Upfront, 2 Installments, 3 Installments)
 *   - a custom plan the learner builds: their own deposit, then the rest split evenly over a
 *     number of payments, inside the course's InstallmentPolicy (minimum deposit, most
 *     payments allowed, smallest payment, spacing and the latest final due date).
 *
 * Pure module (no Prisma, no React): safe on both client and server.
 */

import { z } from 'zod';
import { addDays } from 'date-fns';
import { computeDueDates, findInstallmentPlan, planKey } from '@/config/courses';
import type { InstallmentPlan } from '@/types/course';

export const CUSTOM_PLAN_KEY = 'custom';

export const installmentPolicySchema = z.object({
  allowCustom: z.boolean(),
  /** Smallest deposit as a share of the total (after any discount), 0 to 100. */
  minDepositPct: z.number().int().min(0).max(100),
  /** Smallest deposit in currency units; the larger of this and the percentage applies. */
  minDepositAmount: z.number().int().min(0),
  /** Most payments in a custom plan, the deposit included (2 = deposit plus one more). */
  maxInstallments: z.number().int().min(2).max(12),
  /** Smallest amount any single later payment may be. */
  minInstallmentAmount: z.number().int().min(0),
  /** Days between one payment and the next. */
  intervalDays: z.number().int().min(1).max(180),
  /** The last payment must fall within this many days of enrolling; null = no limit. */
  maxSpanDays: z.number().int().min(1).max(730).nullable(),
});

export type InstallmentPolicy = z.infer<typeof installmentPolicySchema>;

/** Starting values when an admin turns custom plans on for a course. */
export const DEFAULT_INSTALLMENT_POLICY: InstallmentPolicy = {
  allowCustom: true,
  minDepositPct: 15,
  minDepositAmount: 0,
  maxInstallments: 3,
  minInstallmentAmount: 1000,
  intervalDays: 28,
  maxSpanDays: null,
};

/** Reads the Json column; anything malformed counts as "custom plans off". */
export function parseInstallmentPolicy(raw: unknown): InstallmentPolicy | null {
  const parsed = installmentPolicySchema.safeParse(raw);
  return parsed.success && parsed.data.allowCustom ? parsed.data : null;
}

/** The custom-plan rules stored in Course.metadata.installmentPolicy, or null when off. */
export function coursePolicy(metadata: unknown): InstallmentPolicy | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  return parseInstallmentPolicy((metadata as { installmentPolicy?: unknown }).installmentPolicy);
}

export interface SchedulePayment {
  installmentNo: number;
  amount: number;
  label: string;
  dueDate: Date;
}

// Plan keys ("2-installments") are config/courses planKey(label), the one rule for them.
export { planKey };

/** Amounts shown and charged in whole shillings; split steps round to this. */
const ROUND_TO = 100;

/**
 * Splits an amount into n payments rounded down to ROUND_TO, the last taking the remainder,
 * so they always add up exactly. Used by custom plans and by re-spreading a balance after a
 * part payment or a manual deposit.
 */
export function splitEvenly(amount: number, n: number): number[] {
  if (n <= 0) return [];
  const each = Math.floor(amount / n / ROUND_TO) * ROUND_TO || Math.floor(amount / n);
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? amount - each * (n - 1) : each));
}

/**
 * Scales a preset plan to a new total (a discount, or an admin's custom price) so the payments
 * still add up to the total exactly. Rounding each payment on its own used to leave the
 * schedule a few shillings off the total; the last payment now absorbs the difference.
 */
export function scalePresetPlan(plan: InstallmentPlan, total: number, today = new Date()): SchedulePayment[] {
  const dueDates = computeDueDates(plan);
  const base = plan.totalAmount || plan.payments.reduce((s, p) => s + p.amount, 0);
  const ratio = base > 0 ? total / base : 0;
  let allocated = 0;
  return plan.payments.map((p, i) => {
    const isLast = i === plan.payments.length - 1;
    const amount = isLast ? total - allocated : Math.round(p.amount * ratio);
    allocated += amount;
    return {
      installmentNo: i + 1,
      amount,
      label: p.label,
      dueDate: i === 0 ? today : dueDates[i],
    };
  });
}

export interface CustomLimits {
  minDeposit: number;
  maxDeposit: number;
  /** Numbers of payments (deposit included) the learner may pick. */
  counts: number[];
}

/**
 * What a learner may choose for this total. maxDeposit leaves at least one later payment of
 * minInstallmentAmount; a deposit of the whole total is just the Upfront plan.
 */
export function customLimits(policy: InstallmentPolicy, total: number): CustomLimits {
  const pctFloor = Math.ceil((total * policy.minDepositPct) / 100);
  const minDeposit = Math.min(total, Math.max(pctFloor, policy.minDepositAmount, 1));
  const maxDeposit = Math.max(0, total - Math.max(policy.minInstallmentAmount, 1));
  const counts: number[] = [];
  for (let n = 2; n <= policy.maxInstallments; n++) {
    // With the smallest deposit, each later payment must still reach the minimum.
    const perLater = (total - minDeposit) / (n - 1);
    if (perLater >= policy.minInstallmentAmount) counts.push(n);
  }
  return { minDeposit, maxDeposit, counts };
}

export type CustomScheduleResult =
  | { ok: true; payments: SchedulePayment[] }
  | { ok: false; error: string };

function interval(policy: InstallmentPolicy, count: number): number {
  if (!policy.maxSpanDays || count < 2) return policy.intervalDays;
  // Squeeze the spacing so the last payment still lands inside the allowed window.
  return Math.max(1, Math.min(policy.intervalDays, Math.floor(policy.maxSpanDays / (count - 1))));
}

export function buildCustomSchedule(
  policy: InstallmentPolicy,
  total: number,
  deposit: number,
  count: number,
  currency = 'KES',
  today = new Date(),
): CustomScheduleResult {
  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`;
  if (!Number.isInteger(deposit) || !Number.isInteger(count)) {
    return { ok: false, error: 'Use whole numbers for the deposit and the number of payments.' };
  }
  const limits = customLimits(policy, total);
  if (limits.counts.length === 0) {
    return { ok: false, error: 'This course cannot be split into a custom plan at this price.' };
  }
  if (deposit < limits.minDeposit) return { ok: false, error: `The deposit must be at least ${fmt(limits.minDeposit)}.` };
  if (deposit > limits.maxDeposit) return { ok: false, error: `The deposit can be at most ${fmt(limits.maxDeposit)}. To pay everything now, pick Upfront.` };
  if (!limits.counts.includes(count)) {
    return { ok: false, error: `Choose between ${limits.counts[0]} and ${limits.counts[limits.counts.length - 1]} payments.` };
  }

  const amounts = splitEvenly(total - deposit, count - 1);
  if (amounts.some((a) => a < policy.minInstallmentAmount)) {
    return { ok: false, error: `Each later payment must be at least ${fmt(policy.minInstallmentAmount)}. Pick fewer payments or a smaller deposit.` };
  }

  const gap = interval(policy, count);
  const payments: SchedulePayment[] = [
    { installmentNo: 1, amount: deposit, label: 'Deposit', dueDate: today },
    ...amounts.map((amount, i) => ({
      installmentNo: i + 2,
      amount,
      label: `Payment ${i + 2}`,
      dueDate: addDays(today, gap * (i + 1)),
    })),
  ];
  return { ok: true, payments };
}

export interface ResolveScheduleInput {
  plans: InstallmentPlan[];
  installmentsEnabled: boolean;
  policy: InstallmentPolicy | null;
  total: number;
  currency: string;
  /** A preset plan key ("upfront", "2-installments") or CUSTOM_PLAN_KEY. */
  paymentPlan: string;
  custom?: { deposit: number; count: number };
  today?: Date;
}

/**
 * The schedule for what the learner picked, built only from the course's own data. Unknown
 * plan keys and custom plans outside the policy are refused rather than guessed.
 */
export function resolveSchedule(input: ResolveScheduleInput): CustomScheduleResult {
  const { total, currency, today = new Date() } = input;
  if (total <= 0) return { ok: true, payments: [] };

  const upfront: SchedulePayment[] = [{ installmentNo: 1, amount: total, label: 'Full payment', dueDate: today }];
  if (input.paymentPlan === 'upfront' && !findInstallmentPlan(input.plans, 'upfront')) {
    return { ok: true, payments: upfront };
  }
  if (!input.installmentsEnabled) {
    if (input.paymentPlan === 'upfront') return { ok: true, payments: upfront };
    return { ok: false, error: 'This course is paid in full at enrollment.' };
  }
  if (input.paymentPlan === CUSTOM_PLAN_KEY) {
    if (!input.policy) return { ok: false, error: 'Custom payment plans are not offered for this course.' };
    if (!input.custom) return { ok: false, error: 'Choose a deposit and the number of payments.' };
    return buildCustomSchedule(input.policy, total, input.custom.deposit, input.custom.count, currency, today);
  }
  const plan = findInstallmentPlan(input.plans, input.paymentPlan);
  if (!plan) return { ok: false, error: 'That payment plan is not available for this course.' };
  return { ok: true, payments: scalePresetPlan(plan, total, today) };
}

/** "Deposit: KES 5,000 (due 2026-10-13) • Payment 2: ..." for emails. */
export function scheduleSummary(payments: SchedulePayment[], currency: string): string {
  if (payments.length <= 1) return '';
  return payments
    .map((p) => `${p.label}: ${currency} ${p.amount.toLocaleString()} (due ${p.dueDate.toISOString().split('T')[0]})`)
    .join(' • ');
}

/** Whole days from now until a due date; 0 on the day (never -0 in a payload) and negative once overdue. */
export function daysUntil(due: Date, now: Date): number {
  return Math.ceil((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) || 0;
}

const PAID_STATUSES = ['succeeded', 'paid'];

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
    paidFromInstallments || (PAID_STATUSES.includes(enrollment.paymentStatus) ? enrollment.amount : 0);
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
