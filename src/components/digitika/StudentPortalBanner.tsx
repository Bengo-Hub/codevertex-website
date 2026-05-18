'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, CreditCard, BookOpen, Bell } from 'lucide-react';

export function StudentPortalBanner() {
  return (
    <section className="py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary via-primary/90 to-primary/80 p-6 sm:p-8 shadow-xl shadow-primary/20"
        >
          {/* Decorative background rings */}
          <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">
                Already enrolled?
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Access Your Student Portal
              </h3>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {[
                  { icon: CreditCard, text: 'View payment schedule' },
                  { icon: BookOpen, text: 'Track enrollment status' },
                  { icon: Bell, text: 'Pay upcoming installments' },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} className="inline-flex items-center gap-1.5 text-xs text-white/80">
                    <Icon className="h-3.5 w-3.5 text-white/60 shrink-0" />
                    {text}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/digitika/my-enrollment"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary font-black text-sm hover:bg-white/90 transition-colors shadow-lg shadow-black/10 whitespace-nowrap shrink-0"
            >
              My Enrollment
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
