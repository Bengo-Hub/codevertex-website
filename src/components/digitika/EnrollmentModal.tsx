'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, CheckCircle2, CreditCard, BadgePercent, Loader2, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { type CourseCategory, TREASURY_PAY_URL } from '@/config/courses';
import { type DbCourse, type InstallmentPlan } from '@/types/course';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { COUNTRY_CODES, isValidLocalPhone, toInternationalPhone } from '@/lib/phone-countries';
import { ageOn, ageProblem, getAgeRange, guardianProblem, isUnder18 } from '@/lib/learner-rules';
import { TreasuryPaymentModal } from '@bengo-hub/shared-ui-lib/payments';
import {
  CUSTOM_PLAN_KEY,
  buildCustomSchedule,
  customLimits,
  coursePolicy,
  planKey,
  scalePresetPlan,
  type SchedulePayment,
} from '@/lib/installments';


const schema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  email: z.string().email('Valid email required'),
  countryCode: z.string().min(1, 'Required'),
  phone: z.string().min(6, 'Valid phone required'),
  dob: z.string().min(1, 'Date of birth required'),
  experience: z.string().optional(),
  howHeard: z.string().optional(),
  guardianName: z.string().optional(),
  guardianEmail: z.string().optional(),
  guardianPhone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  course: DbCourse;
  category: CourseCategory;
  cohortId?: string;
  onClose: () => void;
}

/** -1 stands for the learner's own plan in the plan picker. */
const CUSTOM_IDX = -1;

export function EnrollmentModal({ course, category, cohortId, onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0);
  const [customDeposit, setCustomDeposit] = useState('');
  const [customCount, setCustomCount] = useState(0);
  const [selectedCC, setSelectedCC] = useState(COUNTRY_CODES[0]);
  const [ageError, setAgeError] = useState('');
  const [guardianError, setGuardianError] = useState('');
  const [enrollError, setEnrollError] = useState('');
  const [chargedNow, setChargedNow] = useState<number | null>(null);
  // The treasury payment intent opened in the shared payment modal; null until enrollment succeeds.
  const [pay, setPay] = useState<{
    intentId: string; amount: number; reference: string; description: string; initiateUrl: string | null; email: string;
  } | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  // Discount code state
  const [discountInput, setDiscountInput] = useState('');
  const [discountValidating, setDiscountValidating] = useState(false);
  const [discount, setDiscount] = useState<{
    ruleId: string; code: string; name: string;
    discountPct?: number; discountAmount?: number;
    discountedTotal: number; remaining: number | null;
  } | null>(null);
  const [discountError, setDiscountError] = useState('');

  const plans: InstallmentPlan[] = (course.installmentsEnabled && course.installmentPlans.length > 0)
    ? course.installmentPlans
    : [{ label: 'Upfront', payments: [{ amount: course.price, label: 'Full payment' }], totalAmount: course.price }];
  const policy = course.installmentsEnabled ? coursePolicy(course.metadata) : null;

  // Every plan covers the same course price. A discount lowers the price; the schedule follows.
  const baseTotal = course.price;
  const discountedTotal = discount?.discountedTotal ?? baseTotal;
  const discountSaving = baseTotal - discountedTotal;
  const limits = policy && discountedTotal > 0 ? customLimits(policy, discountedTotal) : null;
  const customAvailable = !!limits && limits.counts.length > 0;
  const isCustom = selectedPlanIdx === CUSTOM_IDX && customAvailable;
  const selectedPlan = plans[Math.max(0, selectedPlanIdx)] ?? plans[0];
  const customCountValue = limits && limits.counts.includes(customCount)
    ? customCount
    : (limits?.counts[limits.counts.length - 1] ?? 0);
  const customResult = isCustom && policy
    ? buildCustomSchedule(policy, discountedTotal, Math.round(Number(customDeposit) || 0), customCountValue, course.currency)
    : null;
  // Built by the same code the server uses, so the schedule shown is the one charged.
  const schedule: SchedulePayment[] = isCustom
    ? (customResult?.ok ? customResult.payments : [])
    : scalePresetPlan(selectedPlan, discountedTotal);
  const scheduleError = customResult && !customResult.ok && customDeposit !== '' ? customResult.error : '';
  const firstPayment = schedule[0]?.amount ?? 0;
  const isInstallment = schedule.length > 1;
  const canPay = discountedTotal === 0 || (schedule.length > 0 && !(customResult && !customResult.ok));

  async function applyDiscount() {
    if (!discountInput.trim()) return;
    setDiscountValidating(true);
    setDiscountError('');
    setDiscount(null);
    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountInput.trim(), courseId: course.id, amount: baseTotal }),
      });
      const data = await res.json();
      if (!data.valid) {
        setDiscountError(data.error ?? 'Invalid code');
        return;
      }
      setDiscount({
        ruleId: data.ruleId,
        code: data.code,
        name: data.name,
        discountPct: data.discountPct,
        discountAmount: data.discountAmount,
        discountedTotal: data.discountedAmount ?? baseTotal,
        remaining: data.remaining,
      });
    } catch {
      setDiscountError('Could not validate code. Please try again.');
    } finally {
      setDiscountValidating(false);
    }
  }

  const { register, handleSubmit, formState: { errors }, getValues, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { countryCode: '+254' },
  });

  const phoneValue = watch('phone', '');
  const learnerAge = ageOn(watch('dob', ''));
  const isMinor = learnerAge !== null && learnerAge < 18;

  const validatePhone = (phone: string): boolean => isValidLocalPhone(selectedCC, phone);

  const onSubmit = (data: FormData) => {
    // Validate age against course audience requirement
    const ageIssue = ageProblem(data.dob, course.audience);
    setAgeError(ageIssue);
    if (ageIssue) return;
    // Under 18: a parent or guardian must be on record; they get their own parent account.
    const guardianIssue = guardianProblem(data.email, isUnder18(data.dob), {
      name: data.guardianName,
      email: data.guardianEmail,
    });
    setGuardianError(guardianIssue);
    if (guardianIssue) return;
    setStep(2);
  };

  const selectCustom = () => {
    setSelectedPlanIdx(CUSTOM_IDX);
    if (limits && customDeposit === '') setCustomDeposit(String(limits.minDeposit));
    if (limits && !limits.counts.includes(customCount)) setCustomCount(limits.counts[limits.counts.length - 1]);
  };

  const handlePay = async () => {
    if (!canPay) return;
    const { guardianName, guardianEmail, guardianPhone, ...learner } = getValues();
    const data = { ...learner, phone: toInternationalPhone(selectedCC, learner.phone) };
    setSubmitting(true);
    setEnrollError('');
    try {
      // Only the choice is sent; the server rebuilds the schedule from the course's own rules.
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          courseId: course.id,
          courseName: course.name,
          category: category.name,
          cohortId: cohortId ?? undefined,
          totalAmount: discountedTotal,
          currency: course.currency,
          discountRuleId: discount?.ruleId,
          discountCode: discount?.code,
          discountPct: discount?.discountPct,
          discountAmount: discountSaving > 0 ? discountSaving : undefined,
          paymentPlan: isCustom ? CUSTOM_PLAN_KEY : planKey(selectedPlan.label),
          customPlan: isCustom ? { deposit: Math.round(Number(customDeposit) || 0), count: customCountValue } : undefined,
          ...(isMinor
            ? { guardianName: guardianName?.trim(), guardianEmail: guardianEmail?.trim(), guardianPhone: guardianPhone?.trim() || undefined }
            : {}),
        }),
      });

      const result = await res.json().catch(() => ({}));

      // Enrollment was rejected (cohort full, registration closed, already enrolled, plan outside
      // the course rules). Show the reason and do NOT send the learner to pay.
      if (!res.ok) {
        const msg =
          typeof result?.error === 'string'
            ? result.error
            : 'We couldn’t complete your enrollment. Please review your details and try again.';
        setEnrollError(msg);
        return;
      }

      const invoiceRef = result.invoiceRef ?? `DGT-${course.id}-${Date.now()}`;

      // Free course (or a code that brings the price to zero): nothing to pay; the enrollment
      // is already confirmed server-side.
      if (result.isFree || discountedTotal === 0) {
        window.location.href = `${window.location.origin}/digitika/success?reference=${invoiceRef}`;
        setStep(3);
        return;
      }

      // Charge what the server recorded as the first payment.
      const chargeNow = typeof result.firstPaymentAmount === 'number' ? result.firstPaymentAmount : firstPayment;
      setChargedNow(chargeNow);
      const params = new URLSearchParams({
        amount: String(chargeNow),
        tenant: process.env.NEXT_PUBLIC_TREASURY_TENANT ?? 'codevertex',
        reference_id: invoiceRef,
        reference_type: 'digitika_enrollment',
        currency: course.currency,
        description: isInstallment
          ? `Digitika: ${course.name} (payment 1 of ${schedule.length})`
          : `Digitika: ${course.name}`,
        redirect_url: `${window.location.origin}/digitika/success`,
        button_text: 'View My Enrollment',
        gateways: 'paystack,mpesa',
        email: data.email,
      });

      // A pre-created treasury intent makes Paystack return to /digitika/success directly.
      if (result.initiateUrl) {
        params.set('initiate_url', result.initiateUrl);
      }

      if (typeof result.intentId === 'string' && result.intentId) {
        // Pay inside this page with the shared treasury payment modal, like the other Codevertex apps.
        setPay({
          intentId: result.intentId,
          amount: chargeNow,
          reference: invoiceRef,
          description: params.get('description') ?? course.name,
          initiateUrl: result.initiateUrl ?? null,
          email: data.email,
        });
        setPayOpen(true);
      } else {
        // The intent could not be created up front: fall back to treasury's hosted page.
        window.open(`${TREASURY_PAY_URL}?${params}`, '_blank');
      }
      setStep(3);
    } catch {
      setEnrollError('Something went wrong while submitting your enrollment. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (err?: { message?: string }) =>
    `w-full px-4 py-2.5 rounded-lg bg-secondary border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${err ? 'border-destructive' : 'border-border'}`;

  const planCardCls = (active: boolean) =>
    `w-full text-left rounded-xl border-2 p-4 transition-all ${active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 bg-secondary'}`;
  const radioCls = (active: boolean) =>
    `w-4 h-4 rounded-full border-2 shrink-0 ${active ? 'border-primary bg-primary' : 'border-muted-foreground'}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg bg-background rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-background border-b border-border px-6 py-5 z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: category.color }}>
                  {category.name}
                </p>
                <h2 className="text-lg font-bold text-foreground">{course.name}</h2>
              </div>
              <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-4">
              {(['Personal Info', 'Payment Plan', 'Confirm'] as const).map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= i + 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs font-medium ${step === i + 1 ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                  {i < 2 && <div className="w-8 h-px bg-border" />}
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-6">
            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <input type="hidden" {...register('countryCode')} />
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Full Name *</label>
                    <input {...register('fullName')} placeholder="Jane Otieno" className={inputCls(errors.fullName)} />
                    {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      Date of Birth *
                      {course.audience && getAgeRange(course.audience) && (
                        <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                          (Ages {getAgeRange(course.audience)!.min}–{getAgeRange(course.audience)!.max})
                        </span>
                      )}
                    </label>
                    <input type="date" {...register('dob')} className={inputCls(errors.dob)} />
                    {errors.dob && <p className="text-xs text-destructive mt-1">{errors.dob.message}</p>}
                    {ageError && <p className="text-xs text-destructive mt-1">{ageError}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Phone *</label>
                    <div className="flex gap-2">
                      <select
                        value={selectedCC.code}
                        onChange={e => {
                          const cc = COUNTRY_CODES.find(c => c.code === e.target.value) ?? COUNTRY_CODES[0];
                          setSelectedCC(cc);
                          setValue('countryCode', cc.code);
                        }}
                        aria-label="Country code"
                        className="text-xs rounded-lg bg-secondary border border-border px-2 py-2.5 text-foreground focus:outline-none shrink-0"
                      >
                        {COUNTRY_CODES.map(cc => (
                          <option key={cc.code} value={cc.code}>{cc.label}</option>
                        ))}
                      </select>
                      <input
                        {...register('phone')}
                        placeholder={selectedCC.code === '+254' ? '0712 345 678' : 'Phone number'}
                        className={inputCls(errors.phone)}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
                    {!errors.phone && phoneValue && !validatePhone(phoneValue) && (
                      <p className="text-xs text-destructive mt-1">Invalid phone number for {selectedCC.country}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Email *</label>
                    <input type="email" {...register('email')} placeholder="jane@example.com" className={inputCls(errors.email)} />
                    {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                  </div>

                  {isMinor && (
                    <div className="col-span-2 rounded-xl border border-border bg-secondary/60 p-4 space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Parent or guardian</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Learners under 18 enrol with a parent or guardian. They get their own parent account to follow payments and progress.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Full name *</label>
                          <input {...register('guardianName')} placeholder="Mary Otieno" className={inputCls()} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Email *</label>
                          <input type="email" {...register('guardianEmail')} placeholder="mary@example.com" className={inputCls()} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Phone</label>
                          <input type="tel" {...register('guardianPhone')} placeholder="0712 345 678" className={inputCls()} />
                        </div>
                      </div>
                      {guardianError && <p className="text-xs text-destructive">{guardianError}</p>}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Experience Level</label>
                    <select {...register('experience')} className={inputCls()}>
                      <option value="">Select…</option>
                      <option>Complete Beginner</option>
                      <option>Some Basic Knowledge</option>
                      <option>Intermediate</option>
                      <option>Advanced, looking to specialise</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">How did you hear about us?</label>
                    <select {...register('howHeard')} className={inputCls()}>
                      <option value="">Select…</option>
                      <option>Social Media</option>
                      <option>WhatsApp</option>
                      <option>Referral</option>
                      <option>Google Search</option>
                      <option>Partner Institution</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" className="w-full mt-2">Continue</Button>
              </form>
            )}

            {/* STEP 2: Payment Plan Selection */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-bold text-foreground mb-1">Choose your payment plan</h3>
                  <p className="text-xs text-muted-foreground">
                    Every plan covers the full course. {customAvailable && 'You can also set your own deposit and split the rest.'}
                  </p>
                </div>

                <div className="space-y-3">
                  {plans.map((plan, idx) => {
                    const active = selectedPlanIdx === idx;
                    const rows = scalePresetPlan(plan, discountedTotal);
                    return (
                      <button key={plan.label} type="button" onClick={() => setSelectedPlanIdx(idx)} className={planCardCls(active)}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={radioCls(active)} />
                            <span className="font-semibold text-sm text-foreground">{plan.label}</span>
                            {plan.badge && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">{plan.badge}</span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-primary">{formatCurrency(rows[0]?.amount ?? 0, course.currency)} now</span>
                        </div>
                        <div className="pl-6 space-y-1">
                          {rows.map((p) => (
                            <div key={p.installmentNo} className="flex justify-between text-xs text-muted-foreground">
                              <span>{p.label}</span>
                              <span className="font-medium">{formatCurrency(p.amount, course.currency)}</span>
                            </div>
                          ))}
                          {rows.length > 1 && (
                            <div className="flex justify-between text-xs font-semibold text-foreground border-t border-border/50 pt-1 mt-1">
                              <span>Total</span>
                              <span>{formatCurrency(discountedTotal, course.currency)}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {customAvailable && limits && (
                    <div className={planCardCls(isCustom)}>
                      <button type="button" onClick={selectCustom} className="flex w-full items-center justify-between text-left">
                        <div className="flex items-center gap-2">
                          <div className={radioCls(isCustom)} />
                          <span className="font-semibold text-sm text-foreground">Build your own plan</span>
                          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground">from {formatCurrency(limits.minDeposit, course.currency)} now</span>
                      </button>

                      {isCustom && (
                        <div className="mt-4 space-y-4 pl-6">
                          <div>
                            <label htmlFor="custom-deposit" className="text-xs font-semibold text-muted-foreground block mb-1.5">
                              Your deposit today ({course.currency})
                            </label>
                            <input
                              id="custom-deposit"
                              type="number"
                              inputMode="numeric"
                              min={limits.minDeposit}
                              max={limits.maxDeposit}
                              step={100}
                              value={customDeposit}
                              onChange={(e) => setCustomDeposit(e.target.value)}
                              className={inputCls(scheduleError ? { message: scheduleError } : undefined)}
                            />
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Between {formatCurrency(limits.minDeposit, course.currency)} and {formatCurrency(limits.maxDeposit, course.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Pay the rest in</p>
                            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Number of later payments">
                              {limits.counts.map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  role="radio"
                                  aria-checked={customCountValue === n}
                                  onClick={() => setCustomCount(n)}
                                  className={`h-9 rounded-full border px-4 text-xs font-semibold transition-colors ${customCountValue === n ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:border-primary/40'}`}
                                >
                                  {n - 1} {n - 1 === 1 ? 'payment' : 'payments'}
                                </button>
                              ))}
                            </div>
                          </div>
                          {scheduleError ? (
                            <p className="text-xs text-destructive">{scheduleError}</p>
                          ) : schedule.length > 0 && (
                            <div className="space-y-1 rounded-lg border border-border bg-background p-3">
                              {schedule.map((p) => (
                                <div key={p.installmentNo} className="flex justify-between text-xs text-muted-foreground">
                                  <span>{p.label} <span className="text-[11px]">({p.installmentNo === 1 ? 'today' : format(p.dueDate, 'd MMM yyyy')})</span></span>
                                  <span className="font-medium text-foreground">{formatCurrency(p.amount, course.currency)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between text-xs font-semibold text-foreground border-t border-border/50 pt-1 mt-1">
                                <span>Total</span>
                                <span>{formatCurrency(discountedTotal, course.currency)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Discount Code */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground block">Have a promo code?</label>
                  {discount ? (
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/8 px-3 py-2.5">
                      <BadgePercent className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{discount.code}: {discount.name}</p>
                        <p className="text-[10px] text-emerald-600">
                          {discount.discountPct != null ? `${discount.discountPct}% off` : `${course.currency} ${discountSaving.toLocaleString()} off`}
                          {' · '}You save <strong>{formatCurrency(discountSaving, course.currency)}</strong>
                          {discount.remaining != null && ` · ${discount.remaining} use${discount.remaining !== 1 ? 's' : ''} left`}
                        </p>
                      </div>
                      <button type="button" onClick={() => { setDiscount(null); setDiscountInput(''); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Remove</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountInput}
                        onChange={(e) => { setDiscountInput(e.target.value.toUpperCase()); setDiscountError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && applyDiscount()}
                        placeholder="e.g. EARLY10"
                        aria-label="Promo code"
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={applyDiscount}
                        disabled={discountValidating || !discountInput.trim()}
                        className="px-3 py-2 rounded-lg bg-muted border border-border text-xs font-bold hover:bg-accent transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {discountValidating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                      </button>
                    </div>
                  )}
                  {discountError && <p className="text-xs text-destructive">{discountError}</p>}
                </div>

                {canPay && (
                  <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-400">
                    <CreditCard className="inline h-3.5 w-3.5 mr-1.5" />
                    You will pay <strong>{formatCurrency(firstPayment, course.currency)}</strong> today via Paystack or M-Pesa.
                    {isInstallment && ` The remaining ${formatCurrency(discountedTotal - firstPayment, course.currency)} is due in ${schedule.length - 1} later payment${schedule.length - 1 === 1 ? '' : 's'}.`}
                  </div>
                )}

                {enrollError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
                    {enrollError}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button onClick={handlePay} disabled={submitting || !canPay} className="flex-1">
                    {submitting ? 'Redirecting…' : `Pay ${formatCurrency(firstPayment, course.currency)}`}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Done */}
            {step === 3 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{pay ? 'Complete your payment' : 'Payment window opened'}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  Complete your payment of <strong>{formatCurrency(chargedNow ?? firstPayment, course.currency)}</strong> {pay ? 'to confirm your place.' : 'in the payment tab.'}
                  {isInstallment && ` You'll get reminders for the ${schedule.length - 1} remaining payment${schedule.length - 1 === 1 ? '' : 's'}.`}
                  {' '}Once it clears we email your receipt and your student portal login.
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                  Questions? WhatsApp us at{' '}
                  <a href="https://wa.me/254743793901" className="text-primary font-semibold">+254 743 793 901</a>
                </p>
                {pay && !payOpen && (
                  <Button onClick={() => setPayOpen(true)} className="mr-2">Pay now</Button>
                )}
                <Button onClick={onClose} variant="outline">Close</Button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      {pay && (
        <TreasuryPaymentModal
          open={payOpen}
          onOpenChange={setPayOpen}
          paymentIntentId={pay.intentId}
          tenantSlug={process.env.NEXT_PUBLIC_TREASURY_TENANT ?? 'codevertex'}
          amount={pay.amount}
          currency={course.currency}
          description={pay.description}
          allowedMethods="paystack,mpesa"
          initiateUrl={pay.initiateUrl ?? undefined}
          customerEmail={pay.email}
          referenceId={pay.reference}
          referenceType="digitika_enrollment"
          onPaymentConfirmed={() => {
            // The enrollment page shows the receipt and portal details once the payment is applied.
            window.location.href = `${window.location.origin}/digitika/success?reference=${pay.reference}`;
          }}
        />
      )}
    </div>
  );
}
