import type { Metadata } from 'next';
import { CoursesPage } from '@/components/admin/CoursesPage';

export const metadata: Metadata = { title: 'Courses' };
export default function Page() { return <CoursesPage />; }
