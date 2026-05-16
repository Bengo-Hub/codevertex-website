'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Mail,
  Calendar,
  CreditCard,
  Library,
  ChevronRight,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';

const NAV = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Enrollments', href: '/admin/enrollments', icon: BookOpen },
  { label: 'Students', href: '/admin/students', icon: GraduationCap },
  { label: 'Leads', href: '/admin/leads', icon: MessageSquare },
  { label: 'Contacts', href: '/admin/contacts', icon: Mail },
  { label: 'Courses', href: '/admin/courses', icon: Library },
  { label: 'Cohorts', href: '/admin/cohorts', icon: Calendar },
  { label: 'Installments', href: '/admin/installments', icon: CreditCard },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-black">CV</span>
          </div>
          <div>
            <p className="text-xs font-black text-foreground leading-none">Codevertex</p>
            <p className="text-[10px] text-muted-foreground font-medium">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-3 w-3 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-border space-y-0.5">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
          <Settings className="h-4 w-4" />
          View Site
        </Link>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
        {user && (
          <div className="px-3 pt-2 pb-1">
            <p className="text-xs font-semibold text-foreground truncate">{user.fullName ?? user.name ?? user.email}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
