'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BadgePercent, Plus, Pencil, Trash2, RefreshCw, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { StatusBadge } from './StatusBadge';
import { toast } from 'sonner';

interface DiscountRule {
  id: string;
  name: string;
  code: string;
  description?: string;
  discountPct?: number;
  discountAmount?: number;
  courseId?: string;
  maxUses?: number;
  usedCount: number;
  remaining: number | null;
  validFrom?: string;
  validUntil?: string;
  active: boolean;
  createdAt: string;
}

interface PageData { total: number; page: number; pages: number; rules: DiscountRule[] }

const EMPTY_FORM = {
  name: '',
  code: '',
  description: '',
  discountPct: '',
  discountAmount: '',
  courseId: '',
  maxUses: '',
  validFrom: '',
  validUntil: '',
  active: true,
};

export function DiscountsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DiscountRule | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/discounts');
      setData(await res.json());
    } catch {
      toast.error('Failed to load discount rules');
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

  function openEdit(rule: DiscountRule) {
    setEditing(rule);
    setForm({
      name: rule.name,
      code: rule.code,
      description: rule.description ?? '',
      discountPct: rule.discountPct?.toString() ?? '',
      discountAmount: rule.discountAmount?.toString() ?? '',
      courseId: rule.courseId ?? '',
      maxUses: rule.maxUses?.toString() ?? '',
      validFrom: rule.validFrom ? rule.validFrom.slice(0, 16) : '',
      validUntil: rule.validUntil ? rule.validUntil.slice(0, 16) : '',
      active: rule.active,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required');
      return;
    }
    if (!form.discountPct && !form.discountAmount) {
      toast.error('Either discount % or discount amount is required');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
        discountPct: form.discountPct ? parseInt(form.discountPct) : undefined,
        discountAmount: form.discountAmount ? parseInt(form.discountAmount) : undefined,
        courseId: form.courseId.trim() || undefined,
        maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
        validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : undefined,
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
        active: form.active,
      };

      const url = editing ? `/api/admin/discounts/${editing.id}` : '/api/admin/discounts';
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(editing ? 'Discount updated' : 'Discount created');
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(rule: DiscountRule) {
    if (!confirm(`Delete discount "${rule.name}" (${rule.code})?`)) return;
    try {
      const res = await fetch(`/api/admin/discounts/${rule.id}`, { method: 'DELETE' });
      const body = await res.json();
      toast.success(body.deactivated ? 'Discount deactivated (has enrollments)' : 'Discount deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  }

  async function handleToggleActive(rule: DiscountRule) {
    try {
      const res = await fetch(`/api/admin/discounts/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !rule.active }),
      });
      if (!res.ok) throw new Error();
      toast.success(rule.active ? 'Discount deactivated' : 'Discount activated');
      load();
    } catch {
      toast.error('Failed to update');
    }
  }

  const rules = data?.rules ?? [];

  return (
    <div className="max-w-6xl mx-auto">
      <AdminPageHeader
        title="Discount Rules"
        description="Create and manage promo codes and enrollment discounts"
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> New Discount
          </button>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <span className="text-sm text-muted-foreground">{data?.total ?? 0} rule{(data?.total ?? 0) !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl border border-border bg-muted/30 animate-pulse" />)}
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <BadgePercent className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground font-medium">No discount rules yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create promo codes for early-bird, corporate, or bulk discounts.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Code / Name</th>
                <th className="text-left px-5 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Discount</th>
                <th className="text-center px-5 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Usage</th>
                <th className="text-left px-5 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Valid Until</th>
                <th className="text-center px-5 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-right px-5 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-mono font-black text-primary tracking-wider">{rule.code}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rule.name}</p>
                    {rule.description && <p className="text-[10px] text-muted-foreground mt-0.5 italic">{rule.description}</p>}
                  </td>
                  <td className="px-5 py-4">
                    {rule.discountPct != null && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <BadgePercent className="h-3 w-3" /> {rule.discountPct}% off
                      </span>
                    )}
                    {rule.discountAmount != null && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        KES {rule.discountAmount.toLocaleString()} off
                      </span>
                    )}
                    {rule.courseId && <p className="text-[10px] text-muted-foreground mt-1">Course: {rule.courseId}</p>}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <p className="font-bold text-sm">{rule.usedCount}{rule.maxUses != null ? ` / ${rule.maxUses}` : ''}</p>
                    {rule.remaining != null && (
                      <p className={`text-[10px] mt-0.5 ${rule.remaining === 0 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                        {rule.remaining === 0 ? 'Exhausted' : `${rule.remaining} left`}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {rule.validUntil ? new Date(rule.validUntil).toLocaleDateString() : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <StatusBadge status={rule.active ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleActive(rule)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        title={rule.active ? 'Deactivate' : 'Activate'}
                      >
                        {rule.active ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => openEdit(rule)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-black mb-5">{editing ? 'Edit Discount Rule' : 'New Discount Rule'}</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Name *</label>
                  <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Early Bird — May 2026" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Code *</label>
                  <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-1 focus:ring-primary" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="EARLY10" disabled={!!editing} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Description</label>
                <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Discount % <span className="text-muted-foreground font-normal">(or amount)</span></label>
                  <input type="number" min={1} max={100} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={form.discountPct} onChange={(e) => setForm({ ...form, discountPct: e.target.value, discountAmount: '' })} placeholder="e.g. 10" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Discount KES <span className="text-muted-foreground font-normal">(or %)</span></label>
                  <input type="number" min={1} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: e.target.value, discountPct: '' })} placeholder="e.g. 5000" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Max Uses <span className="text-muted-foreground font-normal">(blank = unlimited)</span></label>
                  <input type="number" min={1} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} placeholder="e.g. 5" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Course ID <span className="text-muted-foreground font-normal">(blank = all)</span></label>
                  <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} placeholder="e.g. software-engineering" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Valid From</label>
                  <input type="datetime-local" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Valid Until</label>
                  <input type="datetime-local" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded border-border accent-primary" />
                <label htmlFor="active" className="text-sm font-medium">Active (can be used immediately)</label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Discount'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
