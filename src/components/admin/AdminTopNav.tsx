'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, ExternalLink, ChevronDown, User } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuthStore } from '@/lib/store/auth-store';

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/enrollments': 'Enrollments',
  '/admin/students': 'Students',
  '/admin/leads': 'Leads',
  '/admin/contacts': 'Contacts',
  '/admin/courses': 'Courses',
  '/admin/cohorts': 'Cohorts',
  '/admin/installments': 'Installment Schedules',
};

function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? 'Admin';
}

function getInitials(name?: string | null, email?: string | null): string {
  const source = name ?? email ?? 'A';
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function AdminTopNav() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = user?.fullName ?? user?.name ?? user?.email ?? 'Admin';
  const initials = getInitials(user?.fullName ?? user?.name, user?.email);
  const role = Array.isArray(user?.roles) ? user.roles[0] : (user?.role ?? 'admin');

  return (
    <header className="h-14 shrink-0 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 flex items-center px-6 gap-4">
      {/* Page title */}
      <div className="flex-1">
        <h2 className="text-sm font-semibold text-foreground">{getPageTitle(pathname)}</h2>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition-colors"
            aria-expanded={open}
            aria-haspopup="true"
          >
            {/* Avatar */}
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
              {initials || <User className="h-3.5 w-3.5" />}
            </span>
            <span className="hidden sm:block text-sm font-medium text-foreground max-w-32 truncate">
              {displayName}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-border bg-card shadow-lg py-1 z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wide">
                  {role}
                </span>
              </div>

              {/* Actions */}
              <Link
                href="/"
                target="_blank"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View Site
              </Link>
              <button
                onClick={() => { setOpen(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
