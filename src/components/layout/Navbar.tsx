// Next.js 16 / React 19.2 compatible Navbar
'use client';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '@/hooks/use-auth';
import { NAV_LINKS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, GraduationCap, LayoutDashboard, LogIn, LogOut, Menu, ShieldCheck, Users, X } from 'lucide-react';
import { canAccessAdminPanel } from '@/lib/auth/admin-nav';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/** Shared outside-click + Escape handling for the navbar dropdowns. */
function useDismiss(open: boolean, setOpen: (v: boolean) => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);
  return ref;
}

/**
 * One entry point for every audience: students (SSO), parents (no account: Student ID +
 * one-time code) and staff (SSO, lands on the admin panel).
 */
function useSignInOptions() {
  const { login } = useAuth();
  return [
    {
      key: 'student',
      label: 'Student login',
      hint: 'Lessons, quizzes and certificates',
      icon: GraduationCap,
      onSelect: () => login('/student', 'student'),
    },
    {
      key: 'parent',
      label: 'Parent portal',
      hint: 'Progress and fees, no account needed',
      icon: Users,
      href: '/digitika/parent',
    },
    {
      key: 'staff',
      label: 'Staff login',
      hint: 'Admin dashboard',
      icon: ShieldCheck,
      onSelect: () => login('/admin', 'admin'),
    },
  ] as const;
}

function SignInMenu() {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, setOpen);
  const options = useSignInOptions();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="h-9 pl-4 pr-3 rounded-full bg-primary text-primary-foreground text-sm font-bold inline-flex items-center gap-1.5 shadow-primary hover:shadow-primary-lg transition-all duration-200"
      >
        <LogIn className="h-4 w-4" /> Sign in
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-11 w-72 rounded-xl bg-background border border-border shadow-lg p-1.5 z-50"
          >
            {options.map((o) => {
              const body = (
                <>
                  <span className="mt-0.5 h-8 w-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                    <o.icon className="h-4 w-4 text-primary" />
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-semibold text-foreground">{o.label}</span>
                    <span className="block text-xs text-muted-foreground">{o.hint}</span>
                  </span>
                </>
              );
              const cls = 'w-full flex items-start gap-3 rounded-lg px-2.5 py-2 hover:bg-secondary transition-colors';
              return 'href' in o ? (
                <Link key={o.key} href={o.href} role="menuitem" onClick={() => setOpen(false)} className={cls}>{body}</Link>
              ) : (
                <button key={o.key} role="menuitem" onClick={() => { setOpen(false); o.onSelect(); }} className={cls}>{body}</button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, setOpen);
  // Staff go to the admin panel; students to their learning portal (was always /admin,
  // which sent students to the "unauthorized" page).
  const isStaff = canAccessAdminPanel(user);

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
        aria-haspopup="menu"
        aria-expanded={open}
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
              href={isStaff ? '/admin' : '/student'}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              {isStaff ? 'Admin dashboard' : 'My learning'}
            </Link>
            {isStaff && (
              <Link
                href="/student"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                Student portal
              </Link>
            )}
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
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const signInOptions = useSignInOptions();
  const isStaff = canAccessAdminPanel(user);

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
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="shrink-0 group" aria-label="Codevertex Africa Limited">
            <Image
              src="/images/logo.png"
              alt="Codevertex Africa Limited"
              width={250}
              height={100}
              className="h-16 w-auto object-contain group-hover:opacity-90 transition-opacity dark:brightness-0 dark:invert"
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

         {/* Auth buttons */}
{!isLoading && (
  isAuthenticated ? (
    <UserMenu />
  ) : (
    <div className="hidden sm:block">
      <SignInMenu />
    </div>
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
            className="fixed inset-x-0 top-20 z-40 md:hidden bg-background border-b border-border shadow-lg"
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
                        href={isStaff ? '/admin' : '/student'}
                        className="mt-2 flex h-11 items-center justify-center rounded-full bg-secondary text-foreground text-sm font-bold"
                      >
                        {isStaff ? 'Admin dashboard' : 'My learning'}
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
                    <div className="mt-3 pt-3 border-t border-border flex flex-col gap-1">
                      <p className="px-4 pb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Sign in</p>
                      {signInOptions.map((o) => {
                        const body = (
                          <>
                            <o.icon className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-left">
                              <span className="block text-sm font-semibold text-foreground">{o.label}</span>
                              <span className="block text-xs text-muted-foreground">{o.hint}</span>
                            </span>
                          </>
                        );
                        const cls = 'flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors';
                        return 'href' in o ? (
                          <Link key={o.key} href={o.href} className={cls}>{body}</Link>
                        ) : (
                          <button key={o.key} onClick={() => o.onSelect()} className={cls}>{body}</button>
                        );
                      })}
                    </div>
                  )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
