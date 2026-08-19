'use client';

import { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, Lock, Plus, Pencil, Trash2, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageHeader } from './AdminPageHeader';
import { authedFetch } from '@/lib/auth/authed-fetch';

interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  memberCount: number;
  permissionCodes: string[];
}

interface PermissionGroup {
  module: string;
  label: string;
  permissions: { code: string; action: string; description: string }[];
}

const EMPTY_FORM = { code: '', name: '', description: '', permissionCodes: [] as string[] };

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        authedFetch('/api/admin/roles'),
        authedFetch('/api/admin/permissions'),
      ]);
      if (!rolesRes.ok || !permsRes.ok) throw new Error();
      setRoles((await rolesRes.json()).roles ?? []);
      setGroups((await permsRes.json()).groups ?? []);
    } catch {
      toast.error('Failed to load roles/permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  }

  function openEdit(role: Role) {
    setEditing(role);
    setForm({ code: role.code, name: role.name, description: role.description ?? '', permissionCodes: [...role.permissionCodes] });
    setShowModal(true);
  }

  function togglePermission(code: string) {
    setForm((f) => ({
      ...f,
      permissionCodes: f.permissionCodes.includes(code)
        ? f.permissionCodes.filter((c) => c !== code)
        : [...f.permissionCodes, code],
    }));
  }

  const isLockedAdmin = editing?.code === 'digitika_admin';

  async function handleSave() {
    if (!editing && (!form.code.trim() || !form.name.trim())) {
      toast.error('Code and name are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const res = await authedFetch(`/api/admin/roles/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            editing.isSystem
              ? { permissionCodes: form.permissionCodes }
              : { name: form.name, description: form.description, permissionCodes: form.permissionCodes }
          ),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      } else {
        const res = await authedFetch('/api/admin/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      }
      toast.success(editing ? 'Role updated' : 'Role created');
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(role: Role) {
    if (!confirm(`Delete role "${role.name}"?`)) return;
    try {
      const res = await authedFetch(`/api/admin/roles/${role.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error((await res.json()).error);
      toast.success('Role deleted');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete role');
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <AdminPageHeader
        title="Roles & Permissions"
        description="Digitika admin-panel access control — assign these roles to platform users from the Users page"
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> New Role
          </button>
        }
      />

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl border border-border bg-muted/30 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => (
            <div key={role.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-foreground">{role.name}</p>
                  {role.isSystem && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                      <ShieldCheck className="h-3 w-3" /> System
                    </span>
                  )}
                  {role.code === 'digitika_admin' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                      <Lock className="h-3 w-3" /> Locked
                    </span>
                  )}
                </div>
                {role.description && <p className="text-xs text-muted-foreground mt-1">{role.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><UsersIcon className="h-3 w-3" /> {role.memberCount} member{role.memberCount !== 1 ? 's' : ''}</span>
                  <span>{role.permissionCodes.length} permission{role.permissionCodes.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openEdit(role)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary" title="Edit permissions">
                  <Pencil className="h-4 w-4" />
                </button>
                {!role.isSystem && (
                  <button onClick={() => handleDelete(role)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-destructive" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-black mb-5">{editing ? `Edit ${editing.name}` : 'New Role'}</h2>

            {!editing && (
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Code *</label>
                    <input
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      placeholder="digitika_marketing"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Name *</label>
                    <input
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Digitika Marketing"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Description</label>
                  <input
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
              </div>
            )}

            {editing && !editing.isSystem && (
              <div className="mb-4">
                <label className="block text-xs font-bold mb-1">Description</label>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            )}

            {isLockedAdmin ? (
              <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-4">
                Digitika Admin always carries every permission and cannot be edited.
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Permissions</p>
                {groups.map((group) => (
                  <div key={group.module}>
                    <p className="text-xs font-semibold text-foreground mb-1.5">{group.label}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {group.permissions.map((perm) => (
                        <label key={perm.code} className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.permissionCodes.includes(perm.code)}
                            onChange={() => togglePermission(perm.code)}
                            className="h-3.5 w-3.5 rounded border-border accent-primary"
                          />
                          <span className="capitalize text-muted-foreground">{perm.action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || isLockedAdmin}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
