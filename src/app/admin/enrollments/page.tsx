import type { Metadata } from 'next';
import { EnrollmentsPage } from '@/components/admin/EnrollmentsPage';

export const metadata: Metadata = { title: 'Enrollments' };
export default function Page() { return <EnrollmentsPage />; }
