'use client';

import Link from 'next/link';
import Image from 'next/image';
import { docsUrl, SITE, SSO_URL } from '@/lib/constants';
import { MASKANI, POWER_SUITE } from '@/config/services';
import { NewsletterSignup } from './NewsletterSignup';

const COMPANY_LINKS = [
  { label: 'About us', href: '/about' },
  { label: 'Projects', href: '/projects' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Blog', href: '/blog' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/contact' },
];

// Same three entry points as the navbar "Sign in" menu. /student and /admin send signed-out
// visitors to the sign-in page themselves.
const SIGN_IN_LINKS = [
  { label: 'Student login', href: '/student' },
  { label: 'Parent portal', href: '/digitika/parent' },
  { label: 'Staff login', href: '/admin' },
];

const LEGAL_LINKS = [
  { label: 'Privacy policy', href: '/privacy-policy' },
  { label: 'Terms of service', href: '/terms-of-service' },
  { label: 'Security', href: '/security' },
];

const link = 'text-sm text-night-foreground/70 hover:text-night-foreground';
const heading = 'text-sm font-semibold text-night-foreground mb-4';

export function Footer() {
  return (
    <footer className="bg-night text-night-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" aria-label="Codevertex Africa Limited, home" className="inline-block">
              <Image src="/images/brand/logo-full-light.png" alt="Codevertex Africa Limited" width={597} height={292} className="h-16 w-auto" />
            </Link>
            <p className="mt-5 text-sm text-gold font-semibold">{SITE.tagline}</p>
            <address className="mt-5 not-italic text-sm text-night-foreground/70 space-y-1.5">
              <p>{SITE.address}</p>
              <p><a href={`tel:${SITE.phone2.replace(/\s/g, '')}`} className="hover:text-night-foreground">{SITE.phone2}</a> · <a href={`tel:${SITE.phone1.replace(/\s/g, '')}`} className="hover:text-night-foreground">{SITE.phone1}</a></p>
              <p><a href={`mailto:${SITE.email}`} className="hover:text-night-foreground">{SITE.email}</a></p>
            </address>
            <div className="mt-6 max-w-sm">
              <NewsletterSignup />
            </div>
          </div>

          <div className="lg:col-span-4">
            <p className={heading}>Products</p>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {[...POWER_SUITE, MASKANI].map((p) => (
                <li key={p.id}><Link href={`/services#${p.id}`} className={link}>{p.name}</Link></li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className={heading}>Company</p>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}><Link href={l.href} className={link}>{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className={heading}>Sign in</p>
            <ul className="space-y-2.5">
              {SIGN_IN_LINKS.map((l) => (
                <li key={l.href}><Link href={l.href} className={link}>{l.label}</Link></li>
              ))}
              <li><a href={SSO_URL} target="_blank" rel="noreferrer" className={link}>Client portal</a></li>
              <li><a href={docsUrl('user-guide/')} target="_blank" rel="noreferrer" className={link}>User guides</a></li>
              <li><a href={SITE.whatsapp} target="_blank" rel="noreferrer" className={link}>WhatsApp us</a></li>
            </ul>
          </div>
        </div>

        <div className="py-6 border-t border-white/10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-night-foreground/60">
            © {new Date().getFullYear()} Codevertex Africa Limited. Company No. PVT-VQ1OEVB3.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-xs text-night-foreground/60 hover:text-night-foreground">{l.label}</Link>
            ))}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('cv:open-cookie-settings'))}
              className="text-xs text-night-foreground/60 hover:text-night-foreground"
            >
              Cookie settings
            </button>
            <a href={SITE.socials.linkedin} target="_blank" rel="noreferrer" className="text-xs text-night-foreground/60 hover:text-night-foreground">LinkedIn</a>
            <a href={SITE.socials.twitter} target="_blank" rel="noreferrer" className="text-xs text-night-foreground/60 hover:text-night-foreground">X</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
