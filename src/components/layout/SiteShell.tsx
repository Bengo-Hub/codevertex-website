'use client';

// Renders the public Navbar + Footer only for non-admin, non-auth routes.
// Admin and auth pages provide their own layout/navigation.
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

const SHELL_EXCLUDED = ['/admin', '/auth'];

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
