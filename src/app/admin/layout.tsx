'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

function hasAdminRole(user: { role?: string; roles?: string[] } | null | undefined): boolean {
  if (!user) return false;
  const roles = user.roles ?? (user.role ? [user.role] : []);
  return roles.includes('admin') || user.role === 'admin';
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

    if (!hasAdminRole(user)) {
      router.replace('/admin/unauthorized');
    }
  }, [status, user, router, pathname]);

  // Render nothing while auth state is resolving or redirecting
  if (status === 'loading' || !user || !hasAdminRole(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
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
