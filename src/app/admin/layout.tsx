'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

const ADMIN_ROLES = new Set(['admin', 'superuser', 'platform_admin', 'superadmin']);

function hasAdminRole(user: { role?: string; roles?: string[]; is_platform_owner?: boolean } | null | undefined): boolean {
  if (!user) return false;
  if (user.is_platform_owner) return true;
  const roles = user.roles ?? (user.role ? [user.role] : []);
  return roles.some((r) => ADMIN_ROLES.has(r));
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status } = useAuthStore();

  useEffect(() => {
    if (status === 'loading') return;

    if (status !== 'authenticated' || !user) {
      const returnTo = `/auth/login?returnTo=${encodeURIComponent(pathname)}`;
      router.replace(returnTo);
      return;
    }

    if (!hasAdminRole(user) && pathname !== '/admin/unauthorized') {
      router.replace('/admin/unauthorized');
    }
  }, [status, user, router, pathname]);

  // Show spinner while resolving; let /admin/unauthorized render without a sidebar
  const isUnauthorizedPage = pathname === '/admin/unauthorized';
  if (status === 'loading' || (!user && !isUnauthorizedPage)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (user && !hasAdminRole(user) && !isUnauthorizedPage) {
    return null; // redirecting via useEffect
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
