import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Camera, Check, CircuitBoard, Cpu, Receipt, Scale, Smartphone, TrafficCone, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageIntro } from '@/components/site/PageIntro';
import { CTASection } from '@/components/home/CTASection';
import { SSO_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Integrations',
  description:
    'KRA eTIMS, M-Pesa and card payments, weighbridges, number-plate cameras, CCTV, traffic lights, PLCs and IoT hardware connected to your software by Codevertex.',
};

interface Integration {
  id: string;
  name: string;
  summary: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  photo?: { src: string; alt: string; caption: string };
  apiDocs?: boolean;
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
    apiDocs: true,
  },
  {
    id: 'payments',
    name: 'M-Pesa, PayHero and Paystack',
    summary: 'Collect money where your customers already pay',
    description:
      'STK push, paybill and till collections, card payments and payment links, matched to the right invoice or sale automatically and confirmed with the provider before anything is marked paid.',
    icon: Smartphone,
    features: ['M-Pesa STK push, paybill and till', 'Card payments through Paystack', 'Payment links on invoices and receipts', 'Automatic matching to the sale or invoice'],
  },
  {
    id: 'weighbridges',
    name: 'Weighbridges',
    summary: 'Scale readings straight into TruLoad',
    description:
      'TruConnect, part of TruLoad, reads the weight from the indicator at each station over serial, TCP or UDP and passes it to the weighing software and the remote display units (RDUs) drivers read. It already runs on several indicator brands at Kenyan stations.',
    icon: Scale,
    features: ['Static and mobile scales', 'Serial, TCP and UDP indicators', 'Remote display units for drivers', 'Weight tickets and enforcement records'],
    photo: { src: '/images/photos/weighbridge-demo.webp', alt: 'A weighbridge plate in use at the KeNHA stand at the Mombasa show', caption: 'A weighbridge plate at the KeNHA stand, Mombasa show, 2024' },
  },
  {
    id: 'anpr',
    name: 'Number-plate cameras (ANPR)',
    summary: 'Every truck identified as it is weighed',
    description:
      'We supply, mount and configure ANPR cameras at weighbridges and gates, and link each plate read to the weight record so no ticket is written by hand.',
    icon: Camera,
    features: ['Camera supply and mounting', 'Plate read linked to the weight record', 'Installed with Dahua ANPR cameras', 'Remote support after installation'],
    photo: { src: '/images/photos/field-anpr-install.webp', alt: 'Mounting a Dahua ANPR camera in front of Kanyonyo weighbridge station', caption: 'Mounting an ANPR camera at Kanyonyo weighbridge, January 2025' },
  },
  {
    id: 'traffic',
    name: 'Traffic lights and lane control',
    summary: 'Trucks directed on and off the scale automatically',
    description:
      'Lights and displays at the weighing lane switch from the weighing software, so drivers know when to move without an attendant waving them through. We installed this at the Rubana North and South weighbridges in Tanzania.',
    icon: TrafficCone,
    features: ['Lane traffic lights', 'Driver displays', 'Serial device servers for site equipment', 'Controlled from the weighing software'],
  },
  {
    id: 'cctv',
    name: 'CCTV',
    summary: 'Cameras, recorders and remote viewing',
    description:
      'From a farm or office compound to a weighbridge, we design the camera layout, run the cabling, set up the recorder and show your team how to watch live and play back footage.',
    icon: Camera,
    features: ['Site survey and camera layout', 'Cabling and recorder setup', 'Live and remote viewing', 'Training for the people who watch it'],
    photo: { src: '/images/photos/field-cctv-mast.webp', alt: 'A Codevertex engineer aligning a camera on a mast', caption: 'Aligning a camera on its mast' },
  },
  {
    id: 'plc',
    name: 'PLC automation',
    summary: 'Machines and controllers feeding your reports',
    description:
      'We connect programmable logic controllers on the shop floor to the same data your stock and reporting use, so production numbers are counted, not typed.',
    icon: Cpu,
    features: ['PLC data to the cloud', 'Production and process monitoring', 'Manufacturing and warehousing', 'Custom control logic'],
  },
  {
    id: 'iot',
    name: 'Arduino and IoT',
    summary: 'Sensors and small devices, properly monitored',
    description:
      'Microcontroller programming, sensors and actuators wired into a monitored pipeline that feeds your business software, built to keep running after we leave the site.',
    icon: CircuitBoard,
    features: ['Microcontroller programming', 'Sensor and actuator wiring', 'Device-to-cloud sync', 'Alerts when a device goes quiet'],
    photo: { src: '/images/photos/lab-camera-bench.webp', alt: 'Cameras and a laptop being configured on a workbench', caption: 'Configuring equipment on the bench before it goes to site' },
  },
];

export default function IntegrationsPage() {
  return (
    <>
      <PageIntro
        title="Integrations"
        lead="Tax, payments, scales, cameras and controllers, connected to your software and installed by our own engineers."
      >
        <div className="flex flex-wrap gap-3">
          <Button size="lg" asChild><Link href="/contact?service=iot">Talk to an engineer</Link></Button>
          <Button size="lg" variant="outline" asChild>
            <a href={`${SSO_URL}/docs`} target="_blank" rel="noreferrer">API documentation</a>
          </Button>
        </div>
      </PageIntro>

      <section className="bg-background px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <ul className="max-w-7xl mx-auto divide-y divide-border border-y border-border">
          {INTEGRATIONS.map((it) => (
            <li key={it.id} id={it.id} className="scroll-mt-28 grid gap-8 py-12 lg:grid-cols-12">
              <div className={it.photo ? 'lg:col-span-7' : 'lg:col-span-9'}>
                <it.icon className="h-6 w-6 text-primary mb-3" aria-hidden />
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{it.name}</h2>
                <p className="mt-1 text-muted-foreground">{it.summary}</p>
                <p className="mt-4 text-foreground/85 leading-relaxed max-w-2xl">{it.description}</p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2 max-w-2xl">
                  {it.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild><Link href="/contact?service=iot">Ask about this</Link></Button>
                  {it.apiDocs && (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={`${SSO_URL}/docs`} target="_blank" rel="noreferrer">Read the API docs</a>
                    </Button>
                  )}
                </div>
              </div>
              {it.photo && (
                <figure className="lg:col-span-5">
                  <div className="relative aspect-4/3 overflow-hidden rounded-md bg-muted">
                    <Image src={it.photo.src} alt={it.photo.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
                  </div>
                  <figcaption className="mt-2 text-sm text-muted-foreground">{it.photo.caption}</figcaption>
                </figure>
              )}
            </li>
          ))}
        </ul>
      </section>

      <CTASection title="Have equipment that should talk to your software?" lead="Tell us what is on site and what you want to see on screen, and we will plan the connection with you." />
    </>
  );
}
