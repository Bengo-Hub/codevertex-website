'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { SERVICE_PILLARS } from '@/config/services';

export function ServicesSection() {
  return (
    <section className="relative py-10 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden">
      {/* Magic grid lines background */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      {/* Radial fade — keeps edges clean */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_60%,hsl(var(--background))_100%)] pointer-events-none" />
      {/* Subtle glow accent */}
      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-150 h-100 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">What we do</p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
              Six specializations.<br className="hidden sm:block" /> One partner.
            </h2>
            <p className="text-muted-foreground text-base max-w-xs leading-relaxed">
              From cloud infrastructure to AI analytics, software to security — everything Africa&apos;s most ambitious organisations need.
            </p>
          </div>
        </motion.div>

        {/* Bento grid — gap-px on bg-border creates the "magic grid lines" */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border shadow-sm">
          {SERVICE_PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                className="group relative bg-card hover:bg-secondary/30 transition-colors duration-300"
              >
                <Link
                  href={pillar.cta?.href || '/services'}
                  className="flex flex-col h-full min-h-75"
                >
                  {/* Illustration panel */}
                  <div className="relative w-full h-40 overflow-hidden bg-muted dark:bg-card shrink-0">
                    <Image
                      src={pillar.img}
                      alt={pillar.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `radial-gradient(ellipse at center, ${pillar.color}18, transparent 70%)` }}
                    />
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${pillar.color}15`, border: `1.5px solid ${pillar.color}25` }}
                      >
                        <Icon className="h-4 w-4" style={{ color: pillar.color }} />
                      </div>
                      <div>
                        <h3 className="font-black text-foreground text-sm leading-snug group-hover:text-primary transition-colors">
                          {pillar.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground italic mt-0.5 leading-snug">{pillar.tagline}</p>
                      </div>
                    </div>

                    <ul className="flex-1 flex flex-col gap-1.5 mb-4">
                      {pillar.features.slice(0, 3).map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="w-1 h-1 rounded-full shrink-0" style={{ background: pillar.color }} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div
                      className="flex items-center gap-1 text-xs font-bold mt-auto"
                      style={{ color: pillar.color }}
                    >
                      {pillar.cta?.label || 'Learn more'}
                      <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    </div>
                  </div>

                  {/* Bottom accent line on hover */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(90deg, transparent, ${pillar.color}, transparent)` }}
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex justify-center"
        >
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            View Power Suite products & full service detail
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
