import type { Metadata } from 'next';
import { InstallmentsPage } from '@/components/admin/InstallmentsPage';

export const metadata: Metadata = { title: 'Installments' };
export default function Page() { return <InstallmentsPage />; }
