import {
  LayoutDashboard, BookOpen, GraduationCap, MessageSquare, Mail,
  Calendar, CreditCard, Library, BadgePercent, Users, ShieldCheck,
} from 'lucide-react';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  permission: string;
}

// Single source of truth for the sidebar AND for gating direct URL navigation
// (admin/layout.tsx) — every module maps to its own `digitika.<module>.view` code.
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true, permission: digitikaPerm('dashboard', 'view') },
  { label: 'Enrollments', href: '/admin/enrollments', icon: BookOpen, permission: digitikaPerm('enrollments', 'view') },
  { label: 'Students', href: '/admin/students', icon: GraduationCap, permission: digitikaPerm('students', 'view') },
  { label: 'Leads', href: '/admin/leads', icon: MessageSquare, permission: digitikaPerm('leads', 'view') },
  { label: 'Contacts', href: '/admin/contacts', icon: Mail, permission: digitikaPerm('contacts', 'view') },
  { label: 'Courses', href: '/admin/courses', icon: Library, permission: digitikaPerm('courses', 'view') },
  { label: 'Cohorts', href: '/admin/cohorts', icon: Calendar, permission: digitikaPerm('cohorts', 'view') },
  { label: 'Installments', href: '/admin/installments', icon: CreditCard, permission: digitikaPerm('installments', 'view') },
  { label: 'Discounts', href: '/admin/discounts', icon: BadgePercent, permission: digitikaPerm('discounts', 'view') },
  { label: 'Users', href: '/admin/users', icon: Users, permission: digitikaPerm('users', 'view') },
  { label: 'Roles', href: '/admin/roles', icon: ShieldCheck, permission: digitikaPerm('roles', 'view') },
];

/** Longest-prefix match — returns the permission code guarding a given admin pathname. */
export function requiredPermissionForPath(pathname: string): string | null {
  const matches = ADMIN_NAV_ITEMS
    .filter((item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href)))
    .sort((a, b) => b.href.length - a.href.length);
  return matches[0]?.permission ?? null;
}
