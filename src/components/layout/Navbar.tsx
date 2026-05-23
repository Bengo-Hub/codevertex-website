// Next.js 16 / React 19.2 compatible Navbar
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';
import { NAV_LINKS } from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const displayName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Account';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-9 pl-2 pr-3 rounded-full bg-primary/10 hover:bg-primary/15 transition-colors"
      >
        <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
          {initials}
        </span>
        <span className="text-sm font-medium text-foreground hidden sm:inline">{displayName}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-11 w-52 rounded-xl bg-background border border-border shadow-lg py-1 z-50"
          >
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-semibold text-foreground truncate">{user?.name || displayName}</p>
              {user?.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
            </div>
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              Dashboard
            </Link>
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/8 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, isLoading, login, logout } = useAuth();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 inset-x-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-background/95 backdrop-blur-xl border-b border-border shadow-sm'
            : 'bg-background/80 backdrop-blur-md border-b border-border/40'
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="shrink-0 group" aria-label="Codevertex Africa Limited">
            <Image
              src="/images/logo.png"
              alt="Codevertex Africa Limited"
              width={180}
              height={50}
              className="h-11 w-auto object-contain group-hover:opacity-90 transition-opacity dark:brightness-0 dark:invert"
              priority
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'text-primary bg-primary/8'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Auth button — hidden while loading to avoid flash */}
            {!isLoading && (
              isAuthenticated
                ? <UserMenu />
                : (
                  <button
                    onClick={() => login(pathname)}
                    className="hidden sm:inline-flex h-9 px-5 rounded-full bg-primary text-primary-foreground text-sm font-bold items-center gap-1.5 shadow-primary hover:shadow-primary-lg hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Sign In
                  </button>
                )
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-secondary hover:bg-muted transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden bg-background border-b border-border shadow-lg"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'text-primary bg-primary/8'
                      : 'text-foreground hover:bg-secondary'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {!isLoading && (
                isAuthenticated
                  ? (
                    <>
                      <Link
                        href="/admin"
                        className="mt-2 flex h-11 items-center justify-center rounded-full bg-secondary text-foreground text-sm font-bold"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => logout()}
                        className="mt-1 flex h-11 items-center justify-center rounded-full border border-destructive text-destructive text-sm font-bold"
                      >
                        Sign out
                      </button>
                    </>
                  )
                  : (
                    <button
                      onClick={() => login(pathname)}
                      className="mt-2 flex h-11 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-primary"
                    >
                      Sign In →
                    </button>
                  )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
