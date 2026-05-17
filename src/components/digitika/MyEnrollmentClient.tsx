'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GraduationCap, Search, AlertCircle, ArrowRight, BookOpen, Sparkles } from 'lucide-react';

export function MyEnrollmentClient() {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = studentId.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/students/${encodeURIComponent(trimmed)}/enrollment`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'No enrollment found for this Student ID. Please check and try again.');
        return;
      }
      const data = await res.json();
      // Redirect to success page with the enrollment reference
      router.push(`/digitika/success?reference=${encodeURIComponent(data.invoiceRef)}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header band */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 py-16 px-4 text-primary-foreground">
        <div className="pointer-events-none absolute -top-24 -right-20 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-12 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/25 flex items-center justify-center mx-auto mb-5"
          >
            <GraduationCap className="h-8 w-8" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-widest mb-4">
              <Sparkles className="h-3 w-3" /> Student Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">My Enrollment</h1>
            <p className="mt-3 text-primary-foreground/80 text-base max-w-md mx-auto leading-relaxed">
              Enter your Student ID to view your enrollment status, installment schedule, and pay upcoming fees.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Lookup form */}
      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleLookup}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5"
          >
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Student ID
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. DGT-AB3CDEF2"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Your Student ID was sent to your email when you enrolled.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/8 border border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !studentId.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Looking up…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  View My Enrollment
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </motion.form>

          {/* Help card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Need help?</h2>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Your Student ID starts with <span className="font-mono font-semibold text-foreground">DGT-</span> and was sent to your email at enrollment.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Can&apos;t find your email? Contact us at{' '}
                <a href="mailto:info@codevertexitsolutions.com" className="text-primary underline underline-offset-2">
                  info@codevertexitsolutions.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Call or WhatsApp: <span className="font-semibold text-foreground">+254 743 793 901</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
