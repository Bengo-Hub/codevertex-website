import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Camera, Check, Cpu, Receipt, Scale, Smartphone, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntroImage, PageIntro } from '@/components/site/PageIntro';
import { Reveal } from '@/components/site/Reveal';
import { ProviderLogos } from '@/components/site/ProviderLogos';
import { PhotoCredit } from '@/components/site/PhotoCredit';
import { CTASection } from '@/components/home/CTASection';
import { docsUrl } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Integrations',
  description:
    'KRA eTIMS, M-Pesa, Airtel Money, PayHero and Paystack, weighbridges, number-plate cameras, CCTV, lane lights, PLCs and IoT hardware connected to your software by Codevertex.',
};

interface Shot { src: string; alt: string; caption: string; credit?: string }

interface Integration {
  id: string;
  name: string;
  summary: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  photos?: Shot[];
  logos?: boolean;
  docs?: { label: string; path: string }[];
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'etims',
    name: 'KRA eTIMS',
    summary: 'Every invoice signed with KRA as it is issued',
    description:
      'Books and Treasury is a certified KRA eTIMS OSCU integrator. Businesses on our products get it with their plan. Developers outside the suite can connect to our eTIMS API directly: test in the sandbox, pass the go-live checklist, then switch to production. Self-serve integration has no fee; if you would rather we set it up for you, a one-time fee applies.',
    icon: Receipt,
    features: ['Real-time invoice and credit note signing', 'Sandbox and go-live checklist', 'Self-serve API or assisted setup', 'Pay per use or by subscription'],
    docs: [{ label: 'eTIMS API quickstart', path: 'integrations/etims-api/' }],
    photos: [
      {
        src: '/images/products/treasury-scene.webp',
        alt: 'A finance officer reviewing the Treasury dashboard on her laptop, with an eTIMS-signed invoice on her phone',
        caption: 'Invoices signed with KRA from Books and Treasury',
        credit: 'Photo: Jaokov, CC BY-SA 4.0, via Wikimedia Commons, edited with the Treasury screens added. Shared under CC BY-SA 4.0.',
      },
    ],
  },
  {
    id: 'payments',
    name: 'M-Pesa, Airtel Money, PayHero and Paystack',
    summary: 'Collect money where your customers already pay',
    description:
      'STK push, paybill and till collections, card payments and payment links, matched to the right invoice or sale automatically and confirmed with the provider before anything is marked paid.',
    icon: Smartphone,
    features: ['M-Pesa STK push, paybill and till', 'Card payments through Paystack', 'Payment links on invoices and receipts', 'Automatic matching to the sale or invoice'],
    logos: true,
    photos: [
      {
        src: '/images/products/pos-scene.webp',
        alt: 'The POS on the counter of a Kenyan supermarket',
        caption: 'Paid at the counter',
        credit: 'Counter photo: Mauryndinar, CC BY-SA 4.0, via Wikimedia Commons, with the POS terminal added. Shared under CC BY-SA 4.0.',
      },
      { src: '/images/products/marketplace-scene.webp', alt: 'A marketplace checkout paid with M-Pesa on a phone, beside the storefront on a laptop', caption: 'Paid online' },
    ],
    docs: [
      { label: 'How payments work', path: 'integrations/payment-workflow/' },
      { label: 'Accepting payments with PayHero', path: 'user-guide/treasury/payhero/' },
    ],
  },
  {
    id: 'weighbridges',
    name: 'Weighbridges, ANPR cameras and lane lights',
    summary: 'Every truck identified, weighed and directed automatically',
    description:
      'TruConnect, part of TruLoad, reads the weight from the indicator at each station over serial, TCP or UDP. We mount number-plate (ANPR) cameras so each plate is captured with its weight, and wire the remote display units and lane traffic lights so drivers know when to move. Installed at Kanyonyo in Kenya and at Rubana North and South in Tanzania.',
    icon: Scale,
    features: ['Static and mobile scales', 'ANPR plate read on every weight record', 'Remote display units and lane lights', 'Serial device servers for site equipment'],
    photos: [
      { src: '/images/photos/field-anpr-install.webp', alt: 'Mounting a Dahua ANPR camera in front of Kanyonyo weighbridge station', caption: 'ANPR camera, Kanyonyo weighbridge, Kenya' },
      { src: '/images/photos/rubana-lane-light.webp', alt: 'A lane traffic light and remote display unit at night', caption: 'Lane light and display, Rubana, Tanzania' },
      { src: '/images/photos/rubana-serial-server.webp', alt: 'An eight-port serial device server wired to weighbridge equipment', caption: 'Serial device server for site equipment' },
      { src: '/images/photos/weighbridge-demo.webp', alt: 'A weighbridge plate in use at the KeNHA stand, Mombasa show', caption: 'Weighbridge plate, Mombasa show' },
    ],
  },
  {
    id: 'cctv',
    name: 'CCTV',
    summary: 'Cameras, recorders and remote viewing',
    description:
      'From a farm or office compound to a weighbridge, we design the camera layout, run the cabling, set up the recorder and show your team how to watch live and play back footage.',
    icon: Camera,
    features: ['Site survey and camera layout', 'Cabling and recorder setup', 'Live and remote viewing', 'Training for the people who watch it'],
    photos: [
      { src: '/images/photos/rongo-cctv-team.webp', alt: 'The Codevertex field team on site with CCTV equipment', caption: 'Field team at Moyafarm, Rongo' },
      { src: '/images/photos/rongo-cctv-engineer.webp', alt: 'A Codevertex engineer preparing camera fittings', caption: 'Preparing camera fittings' },
      { src: '/images/photos/field-cctv-mast.webp', alt: 'A Codevertex engineer aligning a camera on a mast', caption: 'Aligning a camera on its mast' },
    ],
  },
  {
    id: 'automation',
    name: 'IoT, PLC and automation',
    summary: 'Sensors, controllers and machines feeding your software',
    description:
      'Programmable logic controllers on the shop floor, microcontrollers, sensors and actuators, wired into a monitored pipeline that feeds your stock, production and reporting, and built to keep running after we leave the site.',
    icon: Cpu,
    features: ['PLC data to the cloud', 'Arduino and microcontroller programming', 'Sensor and actuator wiring', 'Alerts when a device goes quiet'],
    photos: [
      { src: '/images/photos/lab-camera-bench.webp', alt: 'Cameras and a laptop being configured on a workbench', caption: 'Configuring equipment on the bench' },
      { src: '/images/photos/network-rack.webp', alt: 'A network rack installed and cabled by the Codevertex team', caption: 'Network rack, cabled and labelled' },
    ],
  },
];


/** One wide photo, two side by side, three with the first spanning, or a 2 by 2 grid. */
function PhotoGrid({ photos }: { photos: Shot[] }) {
  const wide = (i: number) => photos.length === 1 || (photos.length === 3 && i === 0);
  return (
    <div>
      <div className={`grid gap-3 ${photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {photos.map((p, i) => (
          <figure key={p.src} className={`group relative overflow-hidden rounded-3xl bg-muted shadow-soft ${wide(i) ? 'col-span-2 aspect-video' : 'aspect-4/3'}`}>
            <Image src={p.src} alt={p.alt} fill quality={90} sizes={wide(i) ? '(min-width: 1024px) 45vw, 100vw' : '(min-width: 1024px) 25vw, 50vw'} className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
            <figcaption className="glass absolute left-2 bottom-2 right-2 sm:right-auto rounded-full px-3 py-1 text-xs font-medium text-foreground">{p.caption}</figcaption>
            {p.credit && <PhotoCredit credit={p.credit} className="inset-x-2 top-2" />}
          </figure>
        ))}
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Integrations"
        title="Your equipment and your software, talking to each other."
        lead="Tax, payments, scales, cameras and controllers, connected to your software and installed by our own engineers."
        aside={
          <IntroImage>
            <Image src="/images/photos/field-anpr-install.webp" alt="Mounting a Dahua ANPR camera at Kanyonyo weighbridge station" fill priority sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          </IntroImage>
        }
      >
        <div className="flex flex-wrap gap-3">
          <Button size="lg" className="rounded-full" asChild><Link href="/contact?service=iot">Talk to an engineer</Link></Button>
          <Button size="lg" variant="outline" className="rounded-full bg-white/70" asChild>
            <a href={docsUrl('integrations/')} target="_blank" rel="noreferrer">Integration guides</a>
          </Button>
        </div>
      </PageIntro>

      <section className="bg-background px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <ul className="max-w-7xl mx-auto space-y-6">
          {INTEGRATIONS.map((it, idx) => (
            <Reveal key={it.id} as="li" className="scroll-mt-28">
              <div id={it.id} className={`grid gap-8 rounded-4xl p-6 sm:p-8 lg:grid-cols-12 lg:items-center ${idx % 2 === 0 ? 'bg-mist' : 'bg-background ring-1 ring-border/60 shadow-soft'}`}>
                <div className={it.photos ? 'lg:col-span-6' : 'lg:col-span-12'}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
                    <it.icon className="h-6 w-6" aria-hidden />
                  </span>
                  <h2 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-foreground">{it.name}</h2>
                  <p className="mt-1 text-primary font-medium">{it.summary}</p>
                  <p className="mt-4 text-foreground/85 leading-relaxed max-w-2xl">{it.description}</p>
                  <ul className="mt-5 grid gap-2 sm:grid-cols-2 max-w-2xl">
                    {it.features.map((f) => (
                      <li key={f} className="flex gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden /> {f}</li>
                    ))}
                  </ul>
                  {it.logos && <ProviderLogos className="mt-6" />}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button size="sm" className="rounded-full" asChild><Link href="/contact?service=iot">Ask about this</Link></Button>
                    {it.docs?.map((d) => (
                      <a key={d.path} href={docsUrl(d.path)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-4">
                        <BookOpen className="h-4 w-4" aria-hidden /> {d.label}
                      </a>
                    ))}
                  </div>
                </div>
                {it.photos && <div className="lg:col-span-6"><PhotoGrid photos={it.photos} /></div>}
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      <CTASection title="Have equipment that should talk to your software?" lead="Tell us what is on site and what you want to see on screen, and we will plan the connection with you." />
    </>
  );
}
