import type { Metadata } from 'next';
import { StudentPortalShell } from '@/components/student/StudentPortalShell';
import { StudentIdentityProvider } from '@/components/student/student-identity-context';

export const metadata: Metadata = {
  title: 'Student Portal | Digitika — Codevertex',
  robots: { index: false, follow: false },
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentIdentityProvider>
      <StudentPortalShell>{children}</StudentPortalShell>
    </StudentIdentityProvider>
  );
}
