import type { Metadata } from 'next';
import { CohortsPage } from '@/components/admin/CohortsPage';

export const metadata: Metadata = { title: 'Cohorts' };
export default function Page() { return <CohortsPage />; }
