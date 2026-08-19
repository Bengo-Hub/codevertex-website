'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, ShieldCheck, CloudDownload, UserPlus, Copy, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageHeader } from './AdminPageHeader';
import { DataTable, type Column } from './DataTable';
import { useAuthStore } from '@/lib/store/auth-store';
import { authedFetch } from '@/lib/auth/authed-fetch';
import { hasBypassRole, hasDigitikaPermission, digitikaPerm } from '@/lib/digitika-rbac-catalog';

interface SiteUserRow {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
  tenantSlug: string | null;
  lastLoginAt: string | null;
  syncedFromSso: boolean;
  digitikaRoleCode: string | null;
  digitikaRole: { code: string; name: string } | null;
}

interface PageData { total: number; page: number; pages: number; items: SiteUserRow[] }
interface RoleOption { code: string; name: string }

export function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const canManage = hasBypassRole(currentUser?.roles, currentUser?.is_platform_owner)
    || hasDigitikaPermission(currentUser?.permissions, digitikaPerm('users', 'manage'));

  const [data, setData] = useState<PageData | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', fullName: '', phone: '', digitikaRoleCode: '' });
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), ...(search ? { search } : {}) });
      const res = await authedFetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    authedFetch('/api/admin/roles')
      .then((r) => (r.ok ? r.json() : { roles: [] }))
      .then((d) => setRoles(d.roles ?? []))
      .catch(() => {});
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await authedFetch('/api/admin/users/sync', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Sync failed');
      toast.success(`Synced from SSO — ${body.created} new, ${body.updated} updated`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  async function handleCreate() {
    if (!createForm.email.trim() || !createForm.digitikaRoleCode) {
      toast.error('Email and Digitika role are required');
      return;
    }
    setCreating(true);
    try {
      const res = await authedFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to create user');
      toast.success('User created and linked to SSO');
      setShowCreate(false);
      if (body.tempPassword) {
        setTempPassword({ email: createForm.email.trim(), password: body.tempPassword });
      }
      setCreateForm({ email: '', fullName: '', phone: '', digitikaRoleCode: '' });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(row: SiteUserRow) {
    if (!confirm(
      `Permanently remove ${row.email} from the Digitika Users roster?\n\n` +
      `This deletes their local record and any panel-role grant. It does NOT delete their ` +
      `underlying SSO account — auth-api has no hard-delete for that. If they log in again, ` +
      `they'll reappear here with no Digitika role assigned.`
    )) return;
    setSavingId(row.id);
    try {
      const res = await authedFetch(`/api/admin/users/${row.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error((await res.json()).error || 'Failed to delete');
      toast.success('User removed from the roster');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setSavingId(null);
    }
  }

  async function handleRoleChange(row: SiteUserRow, digitikaRoleCode: string | null) {
    setSavingId(row.id);
    try {
      const res = await authedFetch(`/api/admin/users/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digitikaRoleCode }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update');
      toast.success(digitikaRoleCode ? 'Panel access granted' : 'Panel access revoked');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSavingId(null);
    }
  }

  const columns: Column<SiteUserRow>[] = [
    {
      key: 'email',
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 overflow-hidden">
            {row.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (row.fullName ?? row.email)[0]?.toUpperCase()
            )}
          </span>
          <div className="min-w-40">
            <p className="font-medium text-sm text-foreground">{row.fullName ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'SSO Role',
      render: (row) => <span className="text-xs capitalize text-muted-foreground">{row.role}</span>,
    },
    {
      key: 'digitikaRoleCode',
      header: 'Digitika Panel Role',
      render: (row) => (
        <select
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
          value={row.digitikaRoleCode ?? ''}
          disabled={!canManage || savingId === row.id}
          onChange={(e) => handleRoleChange(row, e.target.value || null)}
        >
          <option value="">No panel access</option>
          {roles.map((r) => (
            <option key={r.code} value={r.code}>{r.name}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'syncedFromSso',
      header: 'Source',
      render: (row) => (
        <span className={`text-[10px] font-semibold uppercase tracking-wide ${row.syncedFromSso && !row.lastLoginAt ? 'text-amber-600' : 'text-emerald-600'}`}>
          {row.syncedFromSso && !row.lastLoginAt ? 'Synced (never logged in)' : 'Active'}
        </span>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last Login',
      render: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString('en-GB') : '—'}
        </span>
      ),
    },
    ...(canManage ? [{
      key: 'actions',
      header: '',
      render: (row: SiteUserRow) => (
        <button
          onClick={() => handleDelete(row)}
          disabled={savingId === row.id}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-destructive disabled:opacity-50"
          title="Remove from Digitika roster"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    } as Column<SiteUserRow>] : []),
  ];

  return (
    <div className="w-full">
      <AdminPageHeader
        title="Users"
        description={`${data?.total ?? 0} platform users · grant Digitika admin-panel access`}
        actions={
          canManage && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                <UserPlus className="h-4 w-4" /> New User
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <CloudDownload className={`h-4 w-4 ${syncing ? 'animate-pulse' : ''}`} />
                {syncing ? 'Syncing…' : 'Sync from SSO'}
              </button>
            </div>
          )
        }
      />

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {!canManage && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          You have view-only access to Users. Role assignment requires the Digitika Admin role.
        </div>
      )}

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        keyField="id"
        total={data?.total}
        page={data?.page}
        pages={data?.pages}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No platform users yet — click “Sync from SSO” to pull the roster."
      />

      {/* New User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-black mb-1">New User</h2>
            <p className="text-xs text-muted-foreground mb-5">
              Creates a real SSO account on the codevertex platform tenant and links it here by its global user ID.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Email *</label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="jane@codevertexafrica.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Full Name</label>
                  <input
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Phone</label>
                  <input
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Digitika Role *</label>
                <select
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={createForm.digitikaRoleCode}
                  onChange={(e) => setCreateForm({ ...createForm, digitikaRoleCode: e.target.value })}
                >
                  <option value="">Select a role…</option>
                  {roles.map((r) => (
                    <option key={r.code} value={r.code}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Temp Password Reveal — shown once right after creation */}
      {tempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-black mb-1">Account Created</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Share this temporary password with <span className="font-semibold text-foreground">{tempPassword.email}</span> — it won&apos;t be shown again.
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <code className="flex-1 text-sm font-mono">{tempPassword.password}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tempPassword.password).catch(() => {});
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                title="Copy"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={() => setTempPassword(null)}
              className="w-full mt-5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
