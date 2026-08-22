import type { Metadata } from 'next';
import { BlogAdminPage } from '@/components/admin/BlogAdminPage';

export const metadata: Metadata = { title: 'Blog' };
export default function Page() { return <BlogAdminPage />; }
