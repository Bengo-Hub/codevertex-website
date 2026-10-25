import type { Metadata } from 'next';
import Image from 'next/image';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
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
        title="Talk to us"
        lead="Tell us what you need and we will reply within one business day. You get a copy of your message by email and a confirmation on WhatsApp."
      />

      <section className="px-4 sm:px-6 lg:px-8 py-14 lg:py-20 bg-background">
        <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ContactForm initialService={service} />
          </div>

          <aside className="lg:col-span-5 space-y-8">
            <figure>
              <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-muted">
                <Image
                  src="/images/photos/kisumu-mega-plaza.webp"
                  alt="Mega Plaza on Oginga Odinga Street, Kisumu"
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-2 text-xs text-muted-foreground">
                Our office at Pioneer House is opposite Mega Plaza. Photo: Leo Hempstone, CC0, via Wikimedia Commons.
              </figcaption>
            </figure>

            <dl className="space-y-5">
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
                <div>
                  <dt className="text-sm font-semibold text-foreground">Office</dt>
                  <dd className="text-sm text-muted-foreground">
                    {SITE.address}
                    <br />
                    <a href={MAP_URL} target="_blank" rel="noreferrer" className="text-primary hover:underline">Open in Google Maps</a>
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
            </dl>

            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              <MessageCircle className="h-4 w-4 text-primary" aria-hidden /> Chat with us on WhatsApp
            </a>
          </aside>
        </div>
      </section>
    </>
  );
}
