import type { Metadata } from 'next';
import { ProjectsAdminPage } from '@/components/admin/ProjectsAdminPage';

export const metadata: Metadata = { title: 'Projects' };
export default function Page() { return <ProjectsAdminPage />; }
