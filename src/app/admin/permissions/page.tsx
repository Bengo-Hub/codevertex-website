import type { Metadata } from 'next';
import { PermissionsPage } from '@/components/admin/PermissionsPage';

export const metadata: Metadata = { title: 'Permissions' };
export default function Page() { return <PermissionsPage />; }
