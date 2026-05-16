'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, CheckCircle2, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { addDays, addWeeks, format } from 'date-fns';
import { type Course, type CourseCategory, type InstallmentPlan, TREASURY_PAY_URL } from '@/config/courses';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

const schema = z.object({
  fullName: z.string().min(2, 'Required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(9, 'Valid phone required'),
  dob: z.string().min(1, 'Required'),
  experience: z.string().optional(),
  howHeard: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  course: Course;
  category: CourseCategory;
  onClose: () => void;
}

// Derive due dates from plan payment labels (e.g. "Week 6" → 6 weeks from now)
function computeDueDates(plan: InstallmentPlan): Date[] {
  const today = new Date();
  return plan.payments.map((_, i) => {
    if (i === 0) return today;
    // Try to parse "Week N" from the label
    const label = plan.payments[i].label;
    const weekMatch = label.match(/week\s+(\d+)/i);
    if (weekMatch) {
      return addWeeks(today, parseInt(weekMatch[1], 10) - 1);
    }
    // Fallback: 4 weeks apart
    return addDays(today, 28 * i);
  });
}

export function EnrollmentModal({ course, category, onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0);

  const plans: InstallmentPlan[] = course.installmentPlans ?? [
    { label: 'Upfront', payments: [{ amount: course.price, label: 'Full payment' }], totalAmount: course.price },
  ];
  const selectedPlan = plans[selectedPlanIdx];
  const firstPayment = selectedPlan.payments[0].amount;
  const isInstallment = selectedPlan.payments.length > 1;

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = () => setStep(2);

  const handlePay = async () => {
    const data = getValues();
    setSubmitting(true);
    try {
      const dueDates = computeDueDates(selectedPlan);
      const installments = selectedPlan.payments.map((p, i) => ({
        installmentNo: i + 1,
        amount: p.amount,
        label: p.label,
        dueDate: dueDates[i].toISOString().split('T')[0],
      }));

      const planKey = selectedPlan.label.toLowerCase().replace(/\s+/g, '-');

      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          courseId: course.id,
          courseName: course.name,
          category: category.name,
          totalAmount: course.price,
          currency: course.currency,
          paymentPlan: planKey,
          firstPaymentAmount: firstPayment,
          installments,
        }),
      });

      const result = await res.json();
      const invoiceRef = result.invoiceRef ?? `DGT-${course.id}-${Date.now()}`;

      // Build treasury redirect URL. When the enrollment API pre-created a treasury intent
      // (and returned initiate_url), we pass it so the treasury-ui pay page skips auto-creation
      // and uses our intent directly — this ensures Paystack redirects to /digitika/success, not
      // to the treasury-ui's own success page wrapper.
      const params = new URLSearchParams({
        amount: String(firstPayment),
        tenant: process.env.NEXT_PUBLIC_TREASURY_TENANT ?? 'codevertex',
        reference_id: invoiceRef,
        reference_type: 'digitika_enrollment',
        currency: course.currency,
        description: isInstallment
          ? `Digitika — ${course.name} (Installment 1 of ${selectedPlan.payments.length})`
          : `Digitika — ${course.name}`,
        redirect_url: `${window.location.origin}/digitika/success`,
        button_text: 'View My Enrollment',
        gateways: 'paystack,mpesa',
        email: data.email,
      });

      if (result.initiateUrl) {
        params.set('initiate_url', result.initiateUrl);
      }

      window.open(`${TREASURY_PAY_URL}?${params}`, '_blank');
      setStep(3);
    } catch {
      // non-blocking — proceed to step 3 so user can still pay
      const params = new URLSearchParams({
        amount: String(firstPayment),
        tenant: process.env.NEXT_PUBLIC_TREASURY_TENANT ?? 'codevertex',
        reference_id: `DGT-${course.id}-${Date.now()}`,
        reference_type: 'digitika_enrollment',
        currency: course.currency,
        description: `Digitika — ${course.name}`,
        redirect_url: `${window.location.origin}/digitika/success`,
        button_text: 'View My Enrollment',
        gateways: 'paystack,mpesa',
      });
      window.open(`${TREASURY_PAY_URL}?${params}`, '_blank');
      setStep(3);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (err?: { message?: string }) =>
    `w-full px-4 py-2.5 rounded-lg bg-secondary border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${err ? 'border-destructive' : 'border-border'}`;

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
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: category.color }}>
                  {category.name}
                </p>
                <h2 className="text-lg font-black text-foreground">{course.name}</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-4">
              {(['Personal Info', 'Payment Plan', 'Confirm'] as const).map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > i + 1 ? 'bg-primary text-primary-foreground' : step === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Full Name *</label>
                    <input {...register('fullName')} placeholder="Jane Otieno" className={inputCls(errors.fullName)} />
                    {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Date of Birth *</label>
                    <input type="date" {...register('dob')} className={inputCls(errors.dob)} />
                    {errors.dob && <p className="text-xs text-destructive mt-1">{errors.dob.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Phone *</label>
                    <input {...register('phone')} placeholder="+254 7XX XXX XXX" className={inputCls(errors.phone)} />
                    {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Email *</label>
                    <input type="email" {...register('email')} placeholder="jane@example.com" className={inputCls(errors.email)} />
                    {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Experience Level</label>
                    <select {...register('experience')} className={inputCls()}>
                      <option value="">Select…</option>
                      <option>Complete Beginner</option>
                      <option>Some Basic Knowledge</option>
                      <option>Intermediate</option>
                      <option>Advanced — looking to specialise</option>
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
                <Button type="submit" className="w-full mt-2">Continue →</Button>
              </form>
            )}

            {/* STEP 2: Payment Plan Selection */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-bold text-foreground mb-1">Choose Your Payment Plan</h3>
                  <p className="text-xs text-muted-foreground">
                    Select how you'd like to pay for {course.name}. All plans cover the full course.
                  </p>
                </div>

                <div className="space-y-3">
                  {plans.map((plan, idx) => (
                    <button
                      key={plan.label}
                      type="button"
                      onClick={() => setSelectedPlanIdx(idx)}
                      className={`w-full text-left rounded-xl border-2 p-4 transition-all ${selectedPlanIdx === idx ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 bg-secondary'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${selectedPlanIdx === idx ? 'border-primary bg-primary' : 'border-muted-foreground'}`} />
                          <span className="font-semibold text-sm text-foreground">{plan.label}</span>
                          {plan.badge && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">
                              {plan.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-primary">
                          {formatCurrency(plan.payments[0].amount, course.currency)} now
                        </span>
                      </div>
                      <div className="pl-6 space-y-1">
                        {plan.payments.map((p, pi) => (
                          <div key={pi} className="flex justify-between text-xs text-muted-foreground">
                            <span>{p.label}</span>
                            <span className="font-medium">{formatCurrency(p.amount, course.currency)}</span>
                          </div>
                        ))}
                        {plan.payments.length > 1 && (
                          <div className="flex justify-between text-xs font-semibold text-foreground border-t border-border/50 pt-1 mt-1">
                            <span>Total</span>
                            <span>{formatCurrency(plan.totalAmount, course.currency)}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-400">
                  <CreditCard className="inline h-3.5 w-3.5 mr-1.5" />
                  You will pay <strong>{formatCurrency(firstPayment, course.currency)}</strong> today via Paystack or M-Pesa.
                  {isInstallment && ` Remaining ${formatCurrency(course.price - firstPayment, course.currency)} will be billed in ${selectedPlan.payments.length - 1} future installment(s).`}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">← Back</Button>
                  <Button onClick={handlePay} disabled={submitting} className="flex-1">
                    {submitting ? 'Redirecting…' : `Pay ${formatCurrency(firstPayment, course.currency)} →`}
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
                <h3 className="text-xl font-black text-foreground mb-3">Payment Window Opened!</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  Complete your payment of <strong>{formatCurrency(firstPayment, course.currency)}</strong> in the Treasury gateway tab.
                  {isInstallment && ` You'll receive reminders for the ${selectedPlan.payments.length - 1} remaining installment(s).`}
                  {' '}Check your email for a receipt and enrollment details.
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                  Questions? WhatsApp us at{' '}
                  <a href="https://wa.me/254743793901" className="text-primary font-semibold">+254 743 793 901</a>
                </p>
                <Button onClick={onClose} variant="outline">Close</Button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
