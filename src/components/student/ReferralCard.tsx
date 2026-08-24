'use client';

import { useEffect, useState } from 'react';
import { Gift, Copy, Check } from 'lucide-react';
import { authedFetch } from '@/lib/auth/authed-fetch';

interface ReferralData {
  code: string;
  discountPct: number | null;
  usedCount: number;
  active: boolean;
}

export function ReferralCard({ studentId }: { studentId: string }) {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authedFetch(`/api/students/${encodeURIComponent(studentId)}/referral-code`);
        if (res.ok && !cancelled) setData(await res.json());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  async function handleCopy() {
    if (!data) return;
    await navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-2">
        <Gift className="h-5 w-5 text-primary" />
        <h2 className="font-bold">Refer a friend</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Share your code — anyone who enrolls with it gets {data?.discountPct ?? 10}% off.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : data ? (
        <div className="flex items-center gap-2">
          <code className="flex-1 px-4 py-2.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 font-mono font-bold text-sm text-foreground">
            {data.code}
          </code>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Couldn&apos;t load your referral code right now.</p>
      )}

      {data && data.usedCount > 0 && (
        <p className="text-xs text-muted-foreground mt-3">
          Used {data.usedCount} time{data.usedCount === 1 ? '' : 's'} so far.
        </p>
      )}
    </section>
  );
}
