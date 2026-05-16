'use client';

import Link from 'next/link';
import Image from 'next/image';
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
} from 'lucide-react';

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

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
      {/* Brand — actual logo image */}
      <div className="px-5 py-4 border-b border-border">
        <Link href="/admin" className="block">
          <Image
            src="/images/logo.png"
            alt="Codevertex"
            width={140}
            height={38}
            priority
            className="h-9 w-auto object-contain"
          />
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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
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
    </aside>
  );
}
