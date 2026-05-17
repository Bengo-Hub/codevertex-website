'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, CreditCard } from 'lucide-react';

export function StudentPortalBanner() {
  return (
    <section className="py-10 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 rounded-2xl border border-primary/20 bg-primary/5"
        >
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground">Already enrolled?</h3>
            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
              View your installment schedule, check payment status, and pay upcoming fees using your Student ID.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href="/digitika/my-enrollment"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <CreditCard className="h-4 w-4" />
              My Enrollment
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
