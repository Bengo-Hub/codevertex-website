'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ENQUIRY_TOPICS } from '@/config/services';
import { COUNTRY_CODES, isValidLocalPhone, toInternationalPhone } from '@/lib/phone-countries';
import { SITE } from '@/lib/constants';

const schema = z
  .object({
    name: z.string().trim().min(2, 'Enter your name'),
    email: z.string().trim().email('Enter a valid email address'),
    countryCode: z.string(),
    phone: z.string().trim().min(1, 'Enter your phone number so we can reply on WhatsApp'),
    service: z.string().optional(),
    message: z.string().trim().min(10, 'Tell us a little more (at least 10 characters)'),
  })
  .superRefine((v, ctx) => {
    const cc = COUNTRY_CODES.find((c) => c.code === v.countryCode);
    if (v.phone && cc && !isValidLocalPhone(cc, v.phone)) {
      ctx.addIssue({ code: 'custom', path: ['phone'], message: `Enter a valid ${cc.country} number, e.g. 0712 345 678` });
    }
  });

type FormData = z.infer<typeof schema>;

const control =
  'h-11 px-3.5 rounded-md bg-background border text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
const field = `w-full ${control}`;

function Label({ htmlFor, children, optional }: { htmlFor: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline justify-between text-sm font-medium text-foreground mb-1.5">
      {children}
      {optional && <span className="text-xs font-normal text-muted-foreground">Optional</span>}
    </label>
  );
}

function Error({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p id={id} className="text-sm text-destructive mt-1.5">{message}</p>;
}

export function ContactForm({ initialService }: { initialService?: string }) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const known = ENQUIRY_TOPICS.some((t) => t.value === initialService);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { countryCode: '+254', service: known ? initialService : '' },
  });

  const onSubmit = async (data: FormData) => {
    const cc = COUNTRY_CODES.find((c) => c.code === data.countryCode) ?? COUNTRY_CODES[0];
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: toInternationalPhone(cc, data.phone),
          service: data.service || undefined,
          message: data.message,
          source: 'contact',
        }),
      });
      if (res.ok) {
        setSentTo(data.name.split(' ')[0]);
        reset({ countryCode: data.countryCode, service: '' });
        return;
      }
      toast.error(`Your message did not go through. Call ${SITE.phone1} or email ${SITE.email}.`);
    } catch {
      toast.error('No connection. Check your internet and send again.');
    }
  };

  if (sentTo) {
    return (
      <div role="status" className="py-10">
        <CheckCircle2 className="h-9 w-9 text-primary mb-4" aria-hidden />
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">Message sent, {sentTo}</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          We have emailed you a copy and sent a WhatsApp confirmation. Someone from the team will reply within one
          business day.
        </p>
        <Button variant="outline" onClick={() => setSentTo(null)}>Send another message</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Full name</Label>
          <input id="name" autoComplete="name" {...register('name')} aria-invalid={!!errors.name} aria-describedby="name-error" className={`${field} ${errors.name ? 'border-destructive' : 'border-input'}`} />
          <Error id="name-error" message={errors.name?.message} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <input id="email" type="email" autoComplete="email" {...register('email')} aria-invalid={!!errors.email} aria-describedby="email-error" className={`${field} ${errors.email ? 'border-destructive' : 'border-input'}`} />
          <Error id="email-error" message={errors.email?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="phone">Phone (WhatsApp)</Label>
        <div className="flex gap-2">
          <select aria-label="Country code" {...register('countryCode')} className={`${control} w-28 shrink-0 border-input px-2`}>
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>{c.country} {c.code}</option>
            ))}
          </select>
          <input id="phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="0712 345 678" {...register('phone')} aria-invalid={!!errors.phone} aria-describedby="phone-help phone-error" className={`${control} min-w-0 flex-1 ${errors.phone ? 'border-destructive' : 'border-input'}`} />
        </div>
        <p id="phone-help" className="text-xs text-muted-foreground mt-1.5">We confirm your message on WhatsApp and may call you back.</p>
        <Error id="phone-error" message={errors.phone?.message} />
      </div>

      <div>
        <Label htmlFor="service" optional>What is it about?</Label>
        <select id="service" {...register('service')} className={`${field} border-input`}>
          <option value="">Choose a product or service</option>
          {ENQUIRY_TOPICS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="message">Message</Label>
        <textarea id="message" rows={5} {...register('message')} aria-invalid={!!errors.message} aria-describedby="message-error" placeholder="What do you need, and for how many branches or users?" className={`${field} h-auto py-3 resize-y ${errors.message ? 'border-destructive' : 'border-input'}`} />
        <Error id="message-error" message={errors.message?.message} />
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}
