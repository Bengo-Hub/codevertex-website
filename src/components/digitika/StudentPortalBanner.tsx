'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, CreditCard, BookOpen, Bell } from 'lucide-react';

const FEATURES = [
  { icon: CreditCard, text: 'View payment schedule' },
  { icon: BookOpen, text: 'Track enrollment status' },
  { icon: Bell, text: 'Pay upcoming installments' },
];

export function StudentPortalBanner() {
  return (
    <section className="py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          {/* Card */}
          <div
            style={{ background: 'hsl(var(--primary))' }}
            className="relative overflow-hidden rounded-2xl shadow-xl"
          >
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-10 bg-white" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10 bg-white" />

            {/* Content — stacks on mobile, side-by-side on sm+ */}
            <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6">

              {/* Left: icon + text */}
              <div className="flex items-start gap-4 flex-1" style={{ minWidth: 0 }}>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>

                <div style={{ minWidth: 0 }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Already enrolled?
                  </p>
                  <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                    Access Your Student Portal
                  </h3>
                  <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
                    {FEATURES.map(({ icon: Icon, text }) => (
                      <span
                        key={text}
                        className="inline-flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: 'rgba(255,255,255,0.8)' }}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }} />
                        {text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: CTA */}
              <Link
                href="/digitika/my-enrollment"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-black transition-opacity hover:opacity-90 shrink-0 self-start sm:self-auto"
                style={{
                  background: 'white',
                  color: 'hsl(var(--primary))',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                  whiteSpace: 'nowrap',
                }}
              >
                My Enrollment
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
