'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { ADMIN_NAV_ITEMS } from '@/lib/auth/admin-nav';
import { hasBypassRole, hasDigitikaPermission } from '@/lib/digitika-rbac-catalog';

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const bypass = hasBypassRole(user?.roles, user?.is_platform_owner, user?.tenant_slug);
  const visibleItems = ADMIN_NAV_ITEMS.filter(
    (item) => bypass || hasDigitikaPermission(user?.permissions, item.permission)
  );

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
            alt="Codevertex Africa Limited"
            width={200}
            height={54}
            priority
            className="h-12 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ label, href, icon: Icon, exact }) => {
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
