import type { Metadata } from 'next';
import { MyEnrollmentClient } from '@/components/digitika/MyEnrollmentClient';

export const metadata: Metadata = {
  title: 'My Enrollment | Digitika Academy',
  description: 'View your Digitika course enrollment, installment schedule, and pay upcoming fees.',
  robots: { index: false, follow: false },
};

export default function MyEnrollmentPage() {
  return <MyEnrollmentClient />;
}
