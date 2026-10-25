'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

/** Footer newsletter form, styled for the night footer. */
export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'loading' || status === 'done') return;
    setStatus('loading');
    setError(null);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'That did not work. Check the address and try again.');
        setStatus('error');
        return;
      }
      setStatus('done');
    } catch {
      setError('No connection. Try again in a moment.');
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <p role="status" className="flex items-center gap-2 text-sm font-semibold text-gold">
        <Check className="h-4 w-4" aria-hidden /> You are subscribed.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="newsletter-email" className="block text-sm text-night-foreground/80 mb-2">
        Product news and course dates, about once a month
      </label>
      <div className="flex gap-2">
        <input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.co.ke"
          className="h-10 flex-1 min-w-0 rounded-md border border-white/20 bg-white/5 px-3 text-sm text-night-foreground placeholder:text-night-foreground/40 focus:outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="h-10 shrink-0 rounded-md bg-gold px-4 text-sm font-semibold text-night hover:bg-gold/90 disabled:opacity-60"
        >
          {status === 'loading' ? 'Joining…' : 'Subscribe'}
        </button>
      </div>
      {error && <p className="text-xs text-red-300 mt-2">{error}</p>}
    </form>
  );
}
