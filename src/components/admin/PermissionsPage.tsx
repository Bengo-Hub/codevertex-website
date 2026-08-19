'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { KeyRound, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageHeader } from './AdminPageHeader';
import { authedFetch } from '@/lib/auth/authed-fetch';

interface PermissionGroup {
  module: string;
  label: string;
  permissions: { code: string; action: string; description: string }[];
}

/** Read-only permission catalog — editing lives on the Roles page (assign per role). */
export function PermissionsPage() {
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch('/api/admin/permissions')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setGroups(d.groups ?? []))
      .catch(() => toast.error('Failed to load permissions'))
      .finally(() => setLoading(false));
  }, []);

  const total = groups.reduce((n, g) => n + g.permissions.length, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <AdminPageHeader
        title="Permissions"
        description={`${total} permission codes across ${groups.length} modules — read-only catalog; assign these to a role from the Roles page`}
        actions={
          <Link
            href="/admin/roles"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Manage Roles <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl border border-border bg-muted/30 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.module} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="h-3.5 w-3.5 text-primary" />
                <p className="text-sm font-bold text-foreground">{group.label}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.permissions.map((perm) => (
                  <span
                    key={perm.code}
                    title={perm.description}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono bg-muted text-muted-foreground"
                  >
                    {perm.code}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
