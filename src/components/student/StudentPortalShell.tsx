'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { StudentSidebar } from './StudentSidebar';
import { StudentTopBar } from './StudentTopBar';
import { useStudentIdentity } from './student-identity-context';
import { StudentSectionProvider } from './student-section-context';
import { authedFetch } from '@/lib/auth/authed-fetch';

export function StudentPortalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const identity = useStudentIdentity();
  const pathname = usePathname();
  const { status, ready } = useAuthStore();

  // Same behaviour as /admin: signed-out visitors go to sign-in and come back here,
  // instead of seeing an "Unauthorized" error (links like the footer "Student login"
  // point straight at /student).
  useEffect(() => {
    if (!ready) return; // wait for the stored session to restore
    if (status !== 'loading' && status !== 'authenticated') {
      router.replace(`/auth/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [ready, status, pathname, router]);

  async function logout() {
    try {
      await authedFetch('/api/auth/session', { method: 'DELETE' });
    } finally {
      router.push('/');
    }
  }

  return (
    <StudentSectionProvider>
      <div className="min-h-screen bg-background">
        <StudentSidebar
          studentName={identity?.name}
          studentInitials={identity?.initials}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onLogout={logout}
        />

        <div className="lg:pl-72">
          <StudentTopBar onOpenMenu={() => setMobileOpen(true)} />
          {children}
        </div>
      </div>
    </StudentSectionProvider>
  );
}
