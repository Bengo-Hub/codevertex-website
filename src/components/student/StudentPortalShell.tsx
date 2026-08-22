'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentSidebar } from './StudentSidebar';
import { StudentTopBar } from './StudentTopBar';
import { useStudentIdentity } from './student-identity-context';
import { StudentSectionProvider } from './student-section-context';

export function StudentPortalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const identity = useStudentIdentity();

  async function logout() {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
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
