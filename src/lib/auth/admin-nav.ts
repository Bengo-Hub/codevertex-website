import {
  LayoutDashboard, BookOpen, GraduationCap, MessageSquare, Mail,
  Calendar, CreditCard, Library, BadgePercent, Users, ShieldCheck, KeyRound, Newspaper,
} from 'lucide-react';
import { DIGITIKA_MODULES, digitikaPerm } from '@/lib/digitika-rbac-catalog';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  permission: string;
}

// href/icon per module key — DIGITIKA_MODULES (src/lib/digitika-rbac-catalog.ts) is the
// single source of truth for WHICH modules exist and their permission codes; this map only
// adds the UI-specific bits (route + icon) so the two never drift out of sync.
const MODULE_UI: Record<string, { href: string; icon: typeof LayoutDashboard; exact?: boolean }> = {
  dashboard: { href: '/admin', icon: LayoutDashboard, exact: true },
  enrollments: { href: '/admin/enrollments', icon: BookOpen },
  students: { href: '/admin/students', icon: GraduationCap },
  leads: { href: '/admin/leads', icon: MessageSquare },
  contacts: { href: '/admin/contacts', icon: Mail },
  courses: { href: '/admin/courses', icon: Library },
  blog: { href: '/admin/blog', icon: Newspaper },
  cohorts: { href: '/admin/cohorts', icon: Calendar },
  installments: { href: '/admin/installments', icon: CreditCard },
  discounts: { href: '/admin/discounts', icon: BadgePercent },
  users: { href: '/admin/users', icon: Users },
  roles: { href: '/admin/roles', icon: ShieldCheck },
};

// Single source of truth for the sidebar AND for gating direct URL navigation
// (admin/layout.tsx) — every module maps to its own `digitika.<module>.view` code.
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  ...DIGITIKA_MODULES.map((mod) => ({
    label: mod.label,
    href: MODULE_UI[mod.key].href,
    icon: MODULE_UI[mod.key].icon,
    exact: MODULE_UI[mod.key].exact,
    permission: digitikaPerm(mod.key, 'view'),
  })),
  // Permissions is a read-only catalog view, not its own module/action pair — it shares
  // the "roles" module's view permission (same administrative area as Roles).
  { label: 'Permissions', href: '/admin/permissions', icon: KeyRound, permission: digitikaPerm('roles', 'view') },
];

/** Longest-prefix match — returns the permission code guarding a given admin pathname. */
export function requiredPermissionForPath(pathname: string): string | null {
  const matches = ADMIN_NAV_ITEMS
    .filter((item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href)))
    .sort((a, b) => b.href.length - a.href.length);
  return matches[0]?.permission ?? null;
}
