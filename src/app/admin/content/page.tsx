import type { Metadata } from 'next';
import { ContentPage } from '@/components/admin/ContentPage';

export const metadata: Metadata = { title: 'Course Content' };
export default function Page() { return <ContentPage />; }
