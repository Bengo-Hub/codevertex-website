import type { Metadata } from 'next';
import { ParentPortalClient } from '@/components/digitika/ParentPortalClient';

export const metadata: Metadata = {
  title: 'Parent Portal | Digitika — Codevertex',
  description: 'Track your child\'s Digitika progress, results and fees, and pay balances, with just their Student ID and a one-time code.',
  robots: { index: false, follow: false },
};

export default function ParentPortalPage() {
  return <ParentPortalClient />;
}
