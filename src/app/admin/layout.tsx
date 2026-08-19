'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopNav } from '@/components/admin/AdminTopNav';
import { AdminFooter } from '@/components/admin/AdminFooter';
import { requiredPermissionForPath } from '@/lib/auth/admin-nav';
import { hasBypassRole, hasDigitikaPermission } from '@/lib/digitika-rbac-catalog';
import type { UserProfile } from '@/lib/store/auth-store';

function canAccessAdminPanel(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  return hasBypassRole(user.roles, user.is_platform_owner, user.tenant_slug) || (user.permissions?.length ?? 0) > 0;
}

function canAccessPath(user: UserProfile | null | undefined, pathname: string): boolean {
  if (!user) return false;
  if (hasBypassRole(user.roles, user.is_platform_owner, user.tenant_slug)) return true;
  const required = requiredPermissionForPath(pathname);
  if (!required) return true; // no specific module guard for this path (e.g. /admin/unauthorized)
  return hasDigitikaPermission(user.permissions, required);
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

    if (pathname === '/admin/unauthorized') return;

    if (!canAccessAdminPanel(user) || !canAccessPath(user, pathname)) {
      router.replace('/admin/unauthorized');
    }
  }, [status, user, router, pathname]);

  const isUnauthorizedPage = pathname === '/admin/unauthorized';
  if (status === 'loading' || (!user && !isUnauthorizedPage)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (user && (!canAccessAdminPanel(user) || !canAccessPath(user, pathname)) && !isUnauthorizedPage) {
    return null;
  }

  return (
    // h-screen + overflow-hidden keeps the whole layout within the viewport;
    // only the <main> scrolls, the sidebar stays fixed.
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!isUnauthorizedPage && <AdminTopNav />}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {children}
        </main>
        {!isUnauthorizedPage && <AdminFooter />}
      </div>
    </div>
  );
}
