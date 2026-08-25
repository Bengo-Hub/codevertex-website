'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { ADMIN_NAV_GROUPS, type AdminNavGroup, type AdminNavItem } from '@/lib/auth/admin-nav';
import { hasBypassRole, hasDigitikaPermission } from '@/lib/digitika-rbac-catalog';

function NavLink({ item, active }: { item: AdminNavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {active && <ChevronRight className="h-3 w-3 opacity-70" />}
    </Link>
  );
}

// Collapsible group section — same pattern as library-ui's NavGroupSection
// (library-service/library-ui/src/components/sidebar.tsx): uppercase tracked-letter header,
// chevron flips on toggle, starts open unless defaultCollapsed AND nothing inside is active.
function NavGroupSection({
  group,
  isActive,
  initialOpen,
}: {
  group: AdminNavGroup;
  isActive: (href: string, exact?: boolean) => boolean;
  initialOpen: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 mb-1 py-0.5 group/header"
        aria-expanded={open}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 group-hover/header:text-foreground transition-colors">
          {group.label}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-muted-foreground/40 transition-transform duration-200 group-hover/header:text-foreground ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div className="space-y-0.5 mb-3">
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href, item.exact)} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const bypass = hasBypassRole(user?.roles, user?.is_platform_owner, user?.tenant_slug);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  // RBAC: hide items the user has no permission for, then drop groups that become empty.
  const visibleGroups = ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => bypass || hasDigitikaPermission(user?.permissions, item.permission)),
  })).filter((group) => group.items.length > 0);

  function isGroupInitiallyOpen(group: AdminNavGroup): boolean {
    if (!group.defaultCollapsed) return true;
    return group.items.some((item) => isActive(item.href, item.exact));
  }

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
      {/* Brand — actual logo image */}
      <div className="px-5 py-4 border-b border-border">
        <Link href="/admin" className="block">
          <Image
            src="/images/logo.png"
            alt="Codevertex Africa Limited"
            width={200}
            height={54}
            priority
            className="h-12 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {visibleGroups.map((group) => (
          <NavGroupSection
            key={group.label}
            group={group}
            isActive={isActive}
            initialOpen={isGroupInitiallyOpen(group)}
          />
        ))}
      </nav>
    </aside>
  );
}
