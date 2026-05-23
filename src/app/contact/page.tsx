'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SITE } from '@/lib/constants';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(2, 'Required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  service: z.string().optional(),
  message: z.string().min(10, 'Message too short'),
});
type FormData = z.infer<typeof schema>;

function ContactForm() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { setSent(true); reset(); }
      else toast.error('Failed to send. Please try WhatsApp or email directly.');
    } catch { toast.error('Network error. Please try again.'); }
    setSubmitting(false);
  };

  const inp = (err?: { message?: string }) =>
    `w-full px-4 py-2.5 rounded-lg bg-secondary border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${err ? 'border-destructive' : 'border-border'}`;

  if (sent) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
        <Send className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-xl font-black text-foreground mb-3">Message sent!</h3>
      <p className="text-muted-foreground text-sm mb-6">We'll be in touch within 24 hours. WhatsApp us for faster responses.</p>
      <Button variant="outline" onClick={() => setSent(false)}>Send another</Button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Full Name *</label>
          <input {...register('name')} placeholder="Jane Otieno" className={inp(errors.name)} />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Phone</label>
          <input {...register('phone')} placeholder="+254 7XX XXX XXX" className={inp()} />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Email *</label>
        <input type="email" {...register('email')} placeholder="jane@company.com" className={inp(errors.email)} />
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Service of interest</label>
        <select {...register('service')} className={inp()}>
          <option value="">Select a service</option>
          {['Enterprise Software Development','AI & Analytics Solutions','Cloud Infrastructure','TruLoad / Axle Management','ISP Billing System','ERP / POS / Books','Digitika Academy Training','Other'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Message *</label>
        <textarea {...register('message')} rows={4} placeholder="Tell us about your project or inquiry…" className={`${inp(errors.message)} resize-none`} />
        {errors.message && <p className="text-xs text-destructive mt-1">{errors.message.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send Message →'}
      </Button>
    </form>
  );
}

export default function ContactPage() {
  return (
    <div className="pt-20">
      <section className="bg-foreground pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Contact</p>
          <h1 className="text-5xl sm:text-6xl font-black text-white dark:text-foreground tracking-tight leading-[1.05] mb-4">Get in touch</h1>
          <p className="text-white/70 dark:text-muted-foreground text-lg max-w-xl leading-relaxed">Book a discovery call, send an inquiry, or drop by our Kisumu office. We respond within 24 hours.</p>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-8">
            <ContactForm />
          </div>
          <div className="lg:col-span-2 space-y-4">
            {[
              { icon: MapPin, title: 'Office', content: SITE.address },
              { icon: Mail, title: 'Email', content: SITE.email, href: `mailto:${SITE.email}` },
              { icon: Phone, title: 'Phone', content: `${SITE.phone1}\n${SITE.phone2}` },
              { icon: MessageCircle, title: 'WhatsApp', content: 'Chat with us for fast responses', href: SITE.whatsapp, accent: true },
            ].map(item => (
              <div key={item.title} className="flex gap-4 p-5 rounded-xl bg-card border border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{item.title}</p>
                  {item.href
                    ? <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={`text-sm font-medium ${item.accent ? 'text-primary' : 'text-foreground hover:text-primary'} transition-colors whitespace-pre-line`}>{item.content}</a>
                    : <p className="text-sm font-medium text-foreground whitespace-pre-line">{item.content}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
