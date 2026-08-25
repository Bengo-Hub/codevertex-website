import {
  LayoutDashboard, BookOpen, GraduationCap, MessageSquare, Mail,
  Calendar, CreditCard, Library, BadgePercent, Users, ShieldCheck, KeyRound, Newspaper,
  School,
} from 'lucide-react';
import { DIGITIKA_MODULES, digitikaPerm } from '@/lib/digitika-rbac-catalog';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  permission: string;
}

export interface AdminNavGroup {
  label: string;
  /** Matches library-ui's Sidebar `NavGroup.defaultCollapsed` — collapsed unless the active route is inside it. */
  defaultCollapsed?: boolean;
  items: AdminNavItem[];
}

// href/icon per module key — DIGITIKA_MODULES (src/lib/digitika-rbac-catalog.ts) is the
// single source of truth for WHICH modules exist and their permission codes; this map only
// adds the UI-specific bits (route + icon) so the two never drift out of sync.
const MODULE_UI: Record<
  string,
  { href: string; icon: typeof LayoutDashboard; exact?: boolean }
> = {
  dashboard: { href: '/admin', icon: LayoutDashboard, exact: true },
  enrollments: { href: '/admin/enrollments', icon: BookOpen },
  students: { href: '/admin/students', icon: GraduationCap },
  leads: { href: '/admin/leads', icon: MessageSquare },
  contacts: { href: '/admin/contacts', icon: Mail },
  courses: { href: '/admin/courses', icon: Library },
  content: { href: '/admin/content', icon: BookOpen },
  classroom: { href: '/admin/classroom', icon: School },
  certificates: { href: '/admin/certificates', icon: GraduationCap },
  blog: { href: '/admin/blog', icon: Newspaper },
  cohorts: { href: '/admin/cohorts', icon: Calendar },
  installments: { href: '/admin/installments', icon: CreditCard },
  discounts: { href: '/admin/discounts', icon: BadgePercent },
  users: { href: '/admin/users', icon: Users },
  roles: { href: '/admin/roles', icon: ShieldCheck },
};

function navItem(moduleKey: string): AdminNavItem {
  const mod = DIGITIKA_MODULES.find((m) => m.key === moduleKey);
  const ui = MODULE_UI[moduleKey];
  if (!mod || !ui) {
    throw new Error(`admin-nav: "${moduleKey}" is missing from DIGITIKA_MODULES or MODULE_UI`);
  }
  return { label: mod.label, href: ui.href, icon: ui.icon, exact: ui.exact, permission: digitikaPerm(moduleKey, 'view') };
}

// Sidebar grouping — adapted from library-ui's collapsible NavGroup sections
// (library-service/library-ui/src/components/sidebar.tsx): a single-item "Overview" group,
// a few domain groups, and a defaultCollapsed "Administration" group at the bottom. Purely
// presentational — DIGITIKA_MODULES + MODULE_UI above stay the single source of truth for
// which modules exist, their routes, and their permission codes; groups just organize them.
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: 'Overview',
    items: ['dashboard'].map(navItem),
  },
  {
    label: 'Academy',
    items: ['courses', 'content', 'classroom', 'certificates', 'cohorts'].map(navItem),
  },
  {
    label: 'Admissions',
    items: ['enrollments', 'students', 'installments', 'discounts'].map(navItem),
  },
  {
    label: 'Growth',
    items: ['leads', 'contacts', 'blog'].map(navItem),
  },
  {
    label: 'Administration',
    defaultCollapsed: true,
    items: [
      ...['users', 'roles'].map(navItem),
      // Permissions is a read-only catalog view, not its own module/action pair — it shares
      // the "roles" module's view permission (same administrative area as Roles).
      { label: 'Permissions', href: '/admin/permissions', icon: KeyRound, permission: digitikaPerm('roles', 'view') },
    ],
  },
];

// Flat list, derived from the groups above so the two can never drift apart — kept for
// requiredPermissionForPath's longest-prefix-match guard in admin/layout.tsx.
export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

/** Longest-prefix match — returns the permission code guarding a given admin pathname. */
export function requiredPermissionForPath(pathname: string): string | null {
  const matches = ADMIN_NAV_ITEMS
    .filter((item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href)))
    .sort((a, b) => b.href.length - a.href.length);
  return matches[0]?.permission ?? null;
}
