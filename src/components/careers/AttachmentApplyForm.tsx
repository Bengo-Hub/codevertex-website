'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SITE } from '@/lib/constants';
import {
  ATTACHMENT_SERVICE_LABEL,
  ATTACHMENT_TRACKS,
  DURATION_OPTIONS,
  YEAR_OPTIONS,
  buildAttachmentMessage,
} from '@/config/attachment';

const schema = z.object({
  name: z.string().min(2, 'Required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(9, 'Phone number required'),
  institution: z.string().min(2, 'Required'),
  course: z.string().min(2, 'Required'),
  year: z.string().min(1, 'Select your year'),
  trackId: z.string().min(1, 'Select a track'),
  startDate: z.string().min(1, 'Pick a start date'),
  duration: z.string().min(1, 'Select a duration'),
  link: z.union([z.literal(''), z.string().url('Enter a full link starting with https://')]).optional(),
  note: z.string().max(1000, 'Please keep this under 1000 characters').optional(),
  consent: z.boolean().refine((v) => v === true, { message: 'Please tick to continue' }),
});
type FormData = z.infer<typeof schema>;

const inp = (err?: { message?: string }) =>
  `w-full px-4 py-2.5 rounded-lg bg-secondary border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${err ? 'border-destructive' : 'border-border'}`;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

export function AttachmentApplyForm() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { consent: false },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          service: ATTACHMENT_SERVICE_LABEL,
          message: buildAttachmentMessage(data),
        }),
      });
      if (res.ok) {
        setSent(true);
        reset();
      } else {
        toast.error(`We could not send your application. Please email ${SITE.email} instead.`);
      }
    } catch {
      toast.error('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Send className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-xl font-black text-foreground mb-2">Application received</h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-sm">
          Thank you. We review applications on a rolling basis and will contact you by email or phone.
        </p>
        <Button variant="outline" onClick={() => setSent(false)}>Submit another application</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full name *" error={errors.name?.message}>
          <input {...register('name')} autoComplete="name" placeholder="Jane Otieno" className={inp(errors.name)} />
        </Field>
        <Field label="Email *" error={errors.email?.message}>
          <input {...register('email')} type="email" autoComplete="email" placeholder="you@example.com" className={inp(errors.email)} />
        </Field>
        <Field label="Phone / WhatsApp *" error={errors.phone?.message}>
          <input {...register('phone')} type="tel" autoComplete="tel" placeholder="+254 7XX XXX XXX" className={inp(errors.phone)} />
        </Field>
        <Field label="Institution *" error={errors.institution?.message}>
          <input {...register('institution')} placeholder="e.g. Maseno University" className={inp(errors.institution)} />
        </Field>
        <Field label="Course / programme *" error={errors.course?.message}>
          <input {...register('course')} placeholder="e.g. BSc Information Technology" className={inp(errors.course)} />
        </Field>
        <Field label="Year of study *" error={errors.year?.message}>
          <select {...register('year')} className={inp(errors.year)} defaultValue="">
            <option value="" disabled>Select</option>
            {YEAR_OPTIONS.map((y) => <option key={y}>{y}</option>)}
          </select>
        </Field>
        <Field label="Preferred track *" error={errors.trackId?.message}>
          <select {...register('trackId')} className={inp(errors.trackId)} defaultValue="">
            <option value="" disabled>Select a track</option>
            {ATTACHMENT_TRACKS.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </Field>
        <Field label="Placement start date *" error={errors.startDate?.message}>
          <input {...register('startDate')} type="date" className={inp(errors.startDate)} />
        </Field>
        <Field label="Duration needed *" error={errors.duration?.message}>
          <select {...register('duration')} className={inp(errors.duration)} defaultValue="">
            <option value="" disabled>Select</option>
            {DURATION_OPTIONS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="CV, GitHub or portfolio link (optional)" error={errors.link?.message}>
          <input {...register('link')} type="url" placeholder="https://" className={inp(errors.link)} />
        </Field>
      </div>

      <Field label="Anything else we should know? (optional)" error={errors.note?.message}>
        <textarea {...register('note')} rows={4} placeholder="Skills, projects, remote or on-site preference…" className={inp(errors.note)} />
      </Field>

      <div>
        <label className="flex items-start gap-3 text-sm text-muted-foreground cursor-pointer">
          <input type="checkbox" {...register('consent')} className="mt-1 h-4 w-4 accent-primary" />
          <span>
            I agree that Codevertex Africa Limited may store and use these details to process my application, as
            described in the{' '}
            <Link href="/privacy-policy" className="text-primary font-semibold hover:underline">Privacy Policy</Link>.
          </span>
        </label>
        {errors.consent && <p className="text-xs text-destructive mt-1">{errors.consent.message}</p>}
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? 'Sending…' : 'Submit application'}
      </Button>
    </form>
  );
}
