'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SSO_URL } from '@/lib/constants';

const SUITE = [
  {
    id: 'erp',
    name: 'ERP',
    tag: 'Business Operations',
    desc: 'Unified finance, HR, procurement and CRM in one modular platform. Designed for African corporates and SMEs.',
    href: 'https://erp.codevertexitsolutions.com',
    img: '/images/illustrations/product-erp.svg',
  },
  {
    id: 'truload',
    name: 'TruLoad',
    tag: 'Transport & Logistics',
    desc: 'IoT axle-load monitoring with tamper-proof data, camera integration, and automated compliance reporting.',
    href: 'https://truload.codevertexitsolutions.com',
    img: '/images/illustrations/product-truload.svg',
  },
  {
    id: 'pos',
    name: 'POS',
    tag: 'Retail & Hospitality',
    desc: 'Offline-capable point-of-sale with inventory intelligence, multi-location support, and M-Pesa integration.',
    href: 'https://pos.codevertexitsolutions.com',
    img: '/images/illustrations/product-pos.svg',
  },
  {
    id: 'isp',
    name: 'ISP Billing',
    tag: 'Telecommunications',
    desc: 'Zero-touch provisioning, subscriber billing, captive portal management and payment reconciliation.',
    href: 'https://ispbilling.codevertexitsolutions.com',
    img: '/images/illustrations/product-isp.svg',
  },
  {
    id: 'books',
    name: 'Books',
    tag: 'Finance & Projects',
    desc: 'Invoicing, Paystack and M-Pesa payments, project tracking, and collaborative team workflows.',
    href: 'https://books.codevertexitsolutions.com',
    img: '/images/illustrations/product-books.svg',
  },
  {
    id: 'vera',
    name: 'Vera AI',
    tag: 'AI Assistant',
    desc: 'Centralised AI assistant for your entire Codevertex workspace — answers queries, generates reports, and surfaces insights across all products.',
    href: '/contact',
    img: '/images/illustrations/product-vera.svg',
  },
];

export function PowerSuiteSection() {
  const [active, setActive] = useState(0);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">One Account</p>
            <h2 className="text-4xl sm:text-5xl font-black text-foreground leading-tight tracking-tight">
              The Codevertex<br />Power Suite
            </h2>
            <p className="text-muted-foreground mt-3 text-base font-medium max-w-md leading-relaxed">
              Six integrated products. One SSO identity. Zero friction between your tools.
            </p>
          </div>
          <Button size="lg" variant="outline" asChild className="self-start lg:self-auto">
            <Link href={SSO_URL} target="_blank" rel="noreferrer">
              Access portal <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Tab layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
          {/* Product list */}
          <div className="lg:col-span-2 border-r border-border divide-y divide-border">
            {SUITE.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setActive(i)}
                className={`w-full text-left px-6 py-5 transition-all duration-200 flex items-center justify-between gap-4
                  ${active === i ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-secondary/60 border-l-2 border-transparent'}`}
              >
                <div>
                  <p className={`font-bold text-base ${active === i ? 'text-primary' : 'text-foreground'}`}>{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.tag}</p>
                </div>
                <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${active === i ? 'text-primary rotate-90' : 'text-muted-foreground'}`} />
              </button>
            ))}
          </div>

          {/* Detail with illustration */}
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:col-span-3 flex flex-col"
          >
            {/* Product illustration */}
            <div className="relative w-full h-64 overflow-hidden bg-muted dark:bg-card border-b border-border">
              <Image
                src={SUITE[active].img}
                alt={SUITE[active].name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </div>

            {/* Text content */}
            <div className="p-8 lg:p-10 flex flex-col justify-center flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">{SUITE[active].tag}</p>
              <h3 className="text-3xl font-black text-foreground tracking-tight mb-4">{SUITE[active].name}</h3>
              <p className="text-muted-foreground leading-relaxed text-base mb-6">{SUITE[active].desc}</p>
              <div className="flex gap-3 flex-wrap">
                <Button asChild>
                  <Link href={SUITE[active].href} target={SUITE[active].href.startsWith('http') ? '_blank' : undefined} rel={SUITE[active].href.startsWith('http') ? 'noreferrer' : undefined}>
                    Open {SUITE[active].name} <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/services">All products</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Security badges */}
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          {['OAuth 2.0', 'OpenID Connect', 'AES-256', 'GDPR-aware', 'Multi-tenant SSO'].map(b => (
            <span key={b} className="px-3 py-1.5 rounded-full bg-card border border-border text-xs font-semibold text-muted-foreground">{b}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
