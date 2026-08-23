import type { Metadata } from 'next';
import { ClassroomPage } from '@/components/admin/ClassroomPage';

export const metadata: Metadata = { title: 'Classroom' };
export default function Page() { return <ClassroomPage />; }
