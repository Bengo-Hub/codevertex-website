import type { Metadata } from 'next';
import Image from 'next/image';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { ContactForm } from '@/components/contact/ContactForm';
import { PageIntro } from '@/components/site/PageIntro';
import { SITE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Contact us',
  description: 'Send us a message, call or WhatsApp us, or visit our office at Pioneer House, Oginga-Odinga Road, Kisumu.',
};

const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=Pioneer+House+Oginga+Odinga+Road+Kisumu';
const tel = (n: string) => `tel:${n.replace(/\s/g, '')}`;

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  const phones = [SITE.phone1, SITE.phone2, SITE.phone3];

  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="Talk to us"
        lead="Tell us what you need and we will reply within one business day. You get a copy of your message by email and a confirmation on WhatsApp."
      />

      <section className="bg-mist px-4 sm:px-6 lg:px-8 pb-16 lg:pb-20">
        <div className="max-w-7xl mx-auto grid gap-6 lg:gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7 rounded-4xl bg-background p-6 sm:p-8 lg:p-10 shadow-lift">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">Send us a message</h2>
            <ContactForm initialService={service} />
          </div>

          <aside className="lg:col-span-5 grid gap-6">
            <figure className="relative aspect-[4/3] overflow-hidden rounded-4xl shadow-soft">
              <Image src="/images/photos/kisumu-mega-plaza.webp" alt="Mega Plaza on Oginga-Odinga Road, Kisumu" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
              <figcaption className="glass absolute left-4 right-4 bottom-4 rounded-2xl px-4 py-3">
                <span className="block text-sm font-semibold text-foreground">Pioneer House, opposite Mega Plaza</span>
                <span className="block text-xs text-muted-foreground">Photo: Leo Hempstone, CC0, via Wikimedia Commons</span>
              </figcaption>
            </figure>

            <dl className="glass rounded-4xl p-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
                <div>
                  <dt className="text-sm font-semibold text-foreground">Office</dt>
                  <dd className="text-sm text-muted-foreground">
                    {SITE.address}
                    <br />
                    <a href={MAP_URL} target="_blank" rel="noreferrer" className="text-primary hover:underline underline-offset-4">Open in Google Maps</a>
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
                <div>
                  <dt className="text-sm font-semibold text-foreground">Phone</dt>
                  {phones.map((p) => (
                    <dd key={p} className="text-sm"><a href={tel(p)} className="text-muted-foreground hover:text-foreground">{p}</a></dd>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
                <div>
                  <dt className="text-sm font-semibold text-foreground">Email</dt>
                  <dd className="text-sm"><a href={`mailto:${SITE.email}`} className="text-muted-foreground hover:text-foreground">{SITE.email}</a></dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
                <div>
                  <dt className="text-sm font-semibold text-foreground">Reply time</dt>
                  <dd className="text-sm text-muted-foreground">Within one business day</dd>
                </div>
              </div>
            </dl>

            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="glass inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-foreground hover:bg-white"
            >
              <MessageCircle className="h-4 w-4 text-primary" aria-hidden /> Chat with us on WhatsApp
            </a>
          </aside>
        </div>
      </section>
    </>
  );
}
