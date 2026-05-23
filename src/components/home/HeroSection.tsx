'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronRight, CircleCheck as CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SSO_URL } from '@/lib/constants';

const STATS = [
  { value: '200+', label: 'Staff trained' },
  { value: '120+', label: 'Certified' },
  { value: '14+', label: 'Products live' },
  { value: '5yr', label: 'In Kisumu, KE' },
];

const SLIDES = [
  {
    id: 'erp',
    product: 'ERP Suite',
    tag: 'Business Operations',
    img: '/images/illustrations/product-erp.svg',
    color: '#0EA5E9',
    href: 'https://erp.codevertexitsolutions.com',
    highlights: ['Finance, HR & Procurement unified', 'Real-time multi-tenant sync'],
  },
  {
    id: 'truload',
    product: 'TruLoad',
    tag: 'Transport & Logistics',
    img: '/images/illustrations/product-truload.svg',
    color: '#38bdf8',
    href: 'https://truload.codevertexitsolutions.com',
    highlights: ['Mobile & static weighing', 'IoT enforcement + commercial tickets'],
  },
  {
    id: 'pos',
    product: 'POS System',
    tag: 'Retail & Hospitality',
    img: '/images/illustrations/product-pos.svg',
    color: '#f59e0b',
    href: 'https://pos.codevertexitsolutions.com',
    highlights: ['M-Pesa & card, offline-capable', 'Multi-location inventory'],
  },
  {
    id: 'isp',
    product: 'ISP Billing',
    tag: 'Telecommunications',
    img: '/images/illustrations/product-isp.svg',
    color: '#4ade80',
    href: 'https://ispbilling.codevertexitsolutions.com',
    highlights: ['Zero-touch subscriber provisioning', 'Captive portal + auto-billing'],
  },
  {
    id: 'books',
    product: 'Books',
    tag: 'Finance & Projects',
    img: '/images/illustrations/product-books.svg',
    color: '#9100B0',
    href: 'https://books.codevertexitsolutions.com',
    highlights: ['Invoicing with M-Pesa & Paystack', 'Project tracking & team collab'],
  },
  {
    id: 'automation',
    product: 'AI & Automation',
    tag: 'Custom AI Assistants & BI',
    img: '/images/illustrations/product-vera.svg',
    color: '#0EA5E9',
    href: '/contact',
    highlights: ['Custom chatbots and virtual assistants', 'Business intelligence and workflow automation'],
  },
];

const TAGLINES = ['Enterprise software.', 'AI that ships.', 'Talent that stays.'];

function useTypewriter(lines: string[], speed = 38) {
  const [displayed, setDisplayed] = useState<string[]>(['', '', '']);
  const lineRef = useRef(0);
  const charRef = useRef(0);

  useEffect(() => {
    lineRef.current = 0;
    charRef.current = 0;
    setDisplayed(['', '', '']);

    const tick = () => {
      const l = lineRef.current;
      const c = charRef.current;
      if (l >= lines.length) return;

      setDisplayed(prev => {
        const next = [...prev];
        next[l] = lines[l].slice(0, c + 1);
        return next;
      });

      charRef.current += 1;
      if (charRef.current >= lines[l].length) {
        lineRef.current += 1;
        charRef.current = 0;
      }
      setTimeout(tick, speed);
    };

    const id = setTimeout(tick, 400);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return displayed;
}

export function HeroSection() {
  const [slide, setSlide] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const lines = useTypewriter(TAGLINES, 38);

  const goTo = useCallback((i: number) => {
    setSlide(i);
    setAnimKey(k => k + 1);
  }, []);

  useEffect(() => {
    const t = setInterval(() => goTo((slide + 1) % SLIDES.length), 4800);
    return () => clearInterval(t);
  }, [slide, goTo]);

  const cur = SLIDES[slide];

  return (
    /*
     * bg-foreground → dark navy in light mode, near-white in dark mode
     * dark:bg-background → deep navy in dark mode (always dark in both themes)
     */
    <section className="relative min-h-screen flex items-start pt-16 overflow-hidden bg-foreground dark:bg-background">
      {/* Animated grid background */}
      <div className="absolute inset-0 grid-bg opacity-[0.07] pointer-events-none" />

      {/* Glow orbs — use primary tones so they adapt to the theme's accent color */}
      <div className="absolute top-1/4 left-1/4 w-150 h-150 bg-primary/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* ── LEFT: Text content ── */}
          <div className="flex flex-col gap-6 pt-4">

            {/* Status pill */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-background/5 dark:bg-foreground/5 border border-background/10 dark:border-foreground/10 text-xs font-bold text-background/60 dark:text-foreground/60 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Kisumu, Kenya · Est. 2020 · Open for engagements
              </span>
            </motion.div>

            {/* Typewriter headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-[3.35rem] xl:text-[3.75rem] font-black tracking-tight leading-[1.07]">
                <span className="block text-background dark:text-foreground min-h-[1.2em]">
                  {lines[0]}<span className="inline-block w-0.5 h-[0.85em] bg-background dark:bg-foreground align-middle ml-0.5 animate-pulse" style={{ opacity: lines[0] === TAGLINES[0] ? 0 : 1 }} />
                </span>
                <span className="block gradient-text min-h-[1.2em]">
                  {lines[1]}<span className="inline-block w-0.5 h-[0.85em] bg-primary align-middle ml-0.5 animate-pulse" style={{ opacity: lines[1] === TAGLINES[1] || (lines[0] !== TAGLINES[0]) ? 0 : 1 }} />
                </span>
                <span className="block text-background/40 dark:text-foreground/40 min-h-[1.2em]">
                  {lines[2]}<span className="inline-block w-0.5 h-[0.85em] bg-background/40 dark:bg-foreground/40 align-middle ml-0.5 animate-pulse" style={{ opacity: lines[2] === TAGLINES[2] || lines[1] !== TAGLINES[1] ? 0 : 1 }} />
                </span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-base sm:text-lg text-background/55 dark:text-foreground/55 leading-relaxed max-w-md"
            >
              Codevertex builds the integrated digital infrastructure East African businesses
              need — bespoke software, AI analytics, cloud hosting, and the talent to run it all.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.45 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Button size="lg" asChild>
                <Link href="/contact">Start a project <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-background/20 dark:border-foreground/20 text-background dark:text-foreground bg-background/5 dark:bg-foreground/5 hover:bg-background/10 dark:hover:bg-foreground/10 hover:border-background/30 dark:hover:border-foreground/30"
                asChild
              >
                <Link href="/services">View products <ChevronRight className="h-4 w-4" /></Link>
              </Button>
              <Link
                href={SSO_URL}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-background/40 dark:text-foreground/40 hover:text-background/80 dark:hover:text-foreground/80 transition-colors"
              >
                Client portal →
              </Link>
            </motion.div>

            {/* Stats grid */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.72, duration: 0.5 }}
              className="grid grid-cols-4 gap-px bg-background/10 dark:bg-foreground/10 rounded-2xl overflow-hidden border border-background/10 dark:border-foreground/10 mt-2"
            >
              {STATS.map((s) => (
                <div key={s.label} className="bg-background/5 dark:bg-foreground/5 backdrop-blur-sm px-3 py-4 text-center">
                  <div className="text-xl sm:text-2xl font-black text-primary tracking-tight">{s.value}</div>
                  <div className="text-[10px] text-background/40 dark:text-foreground/40 mt-1 font-medium leading-snug">{s.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.4 }}
              className="flex flex-wrap items-center gap-x-3 gap-y-1"
            >
              <span className="text-[11px] font-semibold text-background/30 dark:text-foreground/30">Trusted by</span>
              {['Maseno University', 'Danka Africa', 'KCA University', 'Digital Economy ICT'].map((name, i, arr) => (
                <span key={name} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-background/60 dark:text-foreground/60">{name}</span>
                  {i < arr.length - 1 && <span className="text-background/20 dark:text-foreground/20 text-xs">·</span>}
                </span>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT: Product showcase card ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col gap-4"
          >
            {/* Main product card */}
            <div className="relative rounded-2xl border border-background/10 dark:border-foreground/10 bg-background/5 dark:bg-foreground/5 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/40">
              {/* Illustration area — fills card completely */}
              <div className="relative w-full aspect-video bg-foreground/80 dark:bg-background/80">
                {/* Product color glow */}
                <div
                  className="absolute inset-0 transition-opacity duration-700 z-10"
                  style={{ background: `radial-gradient(ellipse at 60% 40%, ${cur.color}20, transparent 65%)` }}
                />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={animKey}
                    className="absolute inset-0"
                    initial={{ scale: 1.05, opacity: 0 }}
                    animate={{ scale: 1.0, opacity: 1 }}
                    exit={{ scale: 0.97, opacity: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                  >
                    <Image
                      src={cur.img}
                      alt={cur.product}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Top-right product badge */}
                <div className="absolute top-4 right-4 z-20">
                  <span
                    className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-sm"
                    style={{ color: cur.color, borderColor: `${cur.color}40`, background: `${cur.color}20` }}
                  >
                    {cur.tag}
                  </span>
                </div>
              </div>

              {/* Product info bar */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`info-${slide}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.35 }}
                  className="px-6 py-5 flex items-center justify-between gap-4 border-t border-background/10 dark:border-foreground/10"
                >
                  <div>
                    <h3 className="text-base font-black text-background dark:text-foreground mb-1.5">{cur.product}</h3>
                    <ul className="flex flex-col gap-1">
                      {cur.highlights.map(h => (
                        <li key={h} className="flex items-center gap-2 text-xs text-background/50 dark:text-foreground/50">
                          <CheckCircle className="h-3 w-3 shrink-0" style={{ color: cur.color }} />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <a
                    href={cur.href}
                    target={cur.href.startsWith('http') ? '_blank' : undefined}
                    rel={cur.href.startsWith('http') ? 'noreferrer' : undefined}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all hover:opacity-80"
                    style={{ color: cur.color, borderColor: `${cur.color}50`, background: `${cur.color}15` }}
                  >
                    Open <ArrowRight className="h-3 w-3" />
                  </a>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-2 justify-center">
              {SLIDES.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goTo(i)}
                  className="relative w-10 h-10 rounded-xl overflow-hidden border-2 transition-all duration-200"
                  style={{
                    borderColor: i === slide ? s.color : 'rgba(255,255,255,0.12)',
                    opacity: i === slide ? 1 : 0.5,
                    boxShadow: i === slide ? `0 0 0 3px ${s.color}30` : 'none',
                  }}
                  aria-label={s.product}
                >
                  <Image
                    src={s.img}
                    alt={s.product}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </button>
              ))}
            </div>

            {/* Progress bar */}
            <div className="flex gap-0.5 rounded-full overflow-hidden">
              {SLIDES.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goTo(i)}
                  className="h-0.5 flex-1 transition-all duration-500"
                  style={{ background: i === slide ? s.color : 'rgba(255,255,255,0.15)' }}
                  aria-label={`Go to ${s.product}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
