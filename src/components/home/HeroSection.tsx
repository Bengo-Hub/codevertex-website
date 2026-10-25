import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Cpu, GraduationCap, LayoutGrid, MapPin, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { POWER_SUITE } from '@/config/services';
import { SITE } from '@/lib/constants';
import { TypedWords } from '@/components/site/TypedWords';
import { CountUp } from '@/components/site/CountUp';
import type { ClientTenant } from '@/lib/tenants';

// The three things the company does, each linking to the section that explains it, so the
// hero alone tells a visitor the whole story and gives them a reason to scroll.
const PILLARS = [
  {
    href: '#products',
    icon: LayoutGrid,
    title: 'Business software',
    text: `${POWER_SUITE.length} connected products: POS, books, stock, payroll and more`,
    img: '/images/products/inventory-scene.webp',
    alt: 'The Inventory dashboard on a laptop in a supermarket',
  },
  {
    href: '#field-work',
    icon: Cpu,
    title: 'Hardware and installation',
    text: 'Cameras, weighbridges, CCTV and networks, fitted by our engineers',
    img: '/images/photos/field-anpr-install.webp',
    alt: 'Mounting an ANPR camera at Kanyonyo weighbridge',
  },
  {
    href: '#digitika',
    icon: GraduationCap,
    title: 'Training',
    text: 'Digitika Academy courses for learners and client teams',
    img: '/images/photos/hackathon-laptops.webp',
    alt: 'Students coding at the MUCISA Hackathon',
  },
];

/**
 * Home page opening: the roll-up headline, live proof (real customers and their logos), a photo
 * of the team with two real product screens floating over it, and the three things we do.
 */
export function HeroSection({ liveBusinesses, tenants }: { liveBusinesses: number; tenants: ClientTenant[] }) {
  const faces = tenants.slice(0, 5);

  return (
    <section className="relative overflow-hidden bg-mist px-4 sm:px-6 lg:px-8 pt-24 lg:pt-28 pb-14 lg:pb-20">
      <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6 animate-fade-in">
          <p className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold text-primary">
            <Image src="/images/brand/logo-mark.png" alt="" width={18} height={18} className="h-[18px] w-[18px]" />
            {SITE.tagline}
          </p>
          <h1 className="mt-6 font-display text-[2.75rem] sm:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.02] text-foreground">
            Software that runs{' '}
            <span className="block min-h-[1.05em]">
              <TypedWords words={['shops.', 'hotels.', 'clinics.', 'schools.', 'weighbridges.', 'African business.']} />
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl text-pretty">
            Point of sale, books, stock, payroll, online orders and customer chat, all under one sign-in. We build
            it, install it on site and train your team, wherever you are in East Africa.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-full px-7 shadow-soft" asChild>
              <Link href="/contact">Book a demo</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-7 bg-white/70" asChild>
              <a href="#products">See the products</a>
            </Button>
          </div>

          {liveBusinesses > 0 && (
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-3">
                {faces.map((t) => (
                  <span key={t.slug} className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-mist shadow-soft" title={t.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- tenant logos */}
                    <img src={t.logoUrl} alt="" className="h-8 w-8 object-contain" />
                  </span>
                ))}
              </div>
              <p className="text-sm leading-snug text-muted-foreground">
                <span className="block font-semibold text-foreground"><CountUp value={liveBusinesses} /> businesses run on Codevertex</span>
                shops, hotels, pharmacies, libraries and road agencies
              </p>
            </div>
          )}
        </div>

        {/* Team photo with two real product screens and two facts floating over it. */}
        <div className="lg:col-span-6 relative">
          <div className="relative aspect-[5/4] overflow-hidden rounded-4xl shadow-lift">
            <Image
              src="/images/photos/team-mucisa-2025.webp"
              alt="Members of the Codevertex team in company shirts at the MUCISA Hackathon 2025"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-[center_30%]"
            />
          </div>

          {/* Cards sit over the trees and below the faces, never on them. */}
          <div className="glass absolute -left-4 sm:-left-8 -bottom-16 w-[58%] rounded-2xl p-2 hidden sm:block animate-fade-in">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
              <Image src="/images/products/marketplace-scene.webp" alt="The Codevertex marketplace on a laptop, with M-Pesa checkout on a phone" fill sizes="30vw" className="object-cover" />
            </div>
          </div>

          <div className="glass relative mt-4 sm:absolute sm:mt-0 sm:top-4 sm:left-4 lg:-left-24 rounded-2xl px-4 py-3 max-w-[15rem]">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BadgeCheck className="h-4 w-4 text-primary" aria-hidden /> KRA eTIMS and M-Pesa built in
            </p>
            <p className="text-xs text-muted-foreground mt-1">Invoices signed with KRA, payments matched automatically</p>
          </div>

          <div className="glass absolute right-4 -bottom-5 rounded-2xl px-4 py-3 hidden sm:flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-foreground">Support on site and on call</p>
              <p className="text-xs text-muted-foreground">Engineers across Kenya and East Africa</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-14 sm:mt-24 lg:mt-28 grid gap-4 md:grid-cols-3">
        {PILLARS.map((p) => (
          <a key={p.title} href={p.href} className="group glass flex items-center gap-4 rounded-3xl p-3 pr-5 transition-transform duration-300 hover:-translate-y-1">
            <span className="relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl">
              <Image src={p.img} alt={p.alt} fill sizes="96px" className="object-cover" />
            </span>
            <span>
              <span className="flex items-center gap-2 font-semibold text-foreground">
                <p.icon className="h-4 w-4 text-primary" aria-hidden /> {p.title}
              </span>
              <span className="block text-sm text-muted-foreground mt-1 leading-snug">{p.text}</span>
            </span>
          </a>
        ))}
      </div>

      <p className="max-w-7xl mx-auto mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
        Codevertex Africa Limited, company no. PVT-VQ1OEVB3. Operating since 2020, with projects in Kenya and Tanzania.
      </p>
    </section>
  );
}
