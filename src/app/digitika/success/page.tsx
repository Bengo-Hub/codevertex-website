import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PaymentSuccessClient } from '@/components/digitika/PaymentSuccessClient';

export const metadata: Metadata = {
  title: 'Enrollment Confirmed | Digitika Academy',
  description: 'Your Digitika Academy enrollment is confirmed.',
  robots: { index: false, follow: false },
};

export default function DigitikSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading…</div>}>
      <PaymentSuccessClient />
    </Suspense>
  );
}
