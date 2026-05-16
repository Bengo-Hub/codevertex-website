import type { Metadata } from 'next';
import { StudentsPage } from '@/components/admin/StudentsPage';

export const metadata: Metadata = { title: 'Students' };
export default function Page() { return <StudentsPage />; }
