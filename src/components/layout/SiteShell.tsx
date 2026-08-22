'use client';

// Renders the public Navbar + Footer only for non-admin, non-auth, non-student
// routes. Admin, auth, and the student portal provide their own
// layout/navigation (the student portal has its own sidebar shell).
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

const SHELL_EXCLUDED = ['/admin', '/auth', '/student'];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const excluded = SHELL_EXCLUDED.some((prefix) => pathname.startsWith(prefix));

  if (excluded) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
