'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authedFetch } from '@/lib/auth/authed-fetch';
import { AdminModal, fieldCls, ghostBtn, labelCls, primaryBtn } from './AdminModal';

export interface LeadFields {
  id?: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  topic: string | null;
  preferredTime: string | null;
  notes: string | null;
}

/** Add a lead taken by phone or in person (no id), or edit one and its follow-up notes. */
export function LeadFormModal({ lead, onClose, onSaved }: { lead?: LeadFields; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    name: lead?.name ?? '',
    email: lead?.email ?? '',
    phone: lead?.phone ?? '',
    topic: lead?.topic ?? '',
    preferredTime: lead?.preferredTime ?? '',
    notes: lead?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (patch: Partial<typeof f>) => setF({ ...f, ...patch });

  async function save() {
    if (!f.name.trim()) return setError('Enter the name.');
    if (!f.email.trim() && !f.phone.trim()) return setError('Give an email or a phone number so the lead can be reached.');
    setSaving(true);
    setError('');
    try {
      const res = await authedFetch(lead?.id ? `/api/admin/leads/${lead.id}` : '/api/admin/leads', {
        method: lead?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setError(typeof body?.error === 'string' ? body.error : 'Could not save the lead.');
      toast.success(lead?.id ? 'Lead updated' : 'Lead added');
      onSaved();
      onClose();
    } catch {
      setError('Something went wrong. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminModal
      wide
      title={lead?.id ? 'Edit lead' : 'Add a lead'}
      onClose={onClose}
      footer={
        <>
          <button className={ghostBtn} onClick={onClose}>Cancel</button>
          <button className={primaryBtn} onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {lead?.id ? 'Save changes' : 'Add lead'}
          </button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2"><span className={labelCls}>Name</span>
          <input value={f.name} onChange={(e) => set({ name: e.target.value })} className={fieldCls} /></label>
        <label className="block"><span className={labelCls}>Email</span>
          <input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} className={fieldCls} /></label>
        <label className="block"><span className={labelCls}>Phone</span>
          <input value={f.phone} onChange={(e) => set({ phone: e.target.value })} className={fieldCls} /></label>
        <label className="block"><span className={labelCls}>Interested in</span>
          <input value={f.topic} onChange={(e) => set({ topic: e.target.value })} placeholder="e.g. Tech Explorers" className={fieldCls} /></label>
        <label className="block"><span className={labelCls}>Preferred time to call</span>
          <input value={f.preferredTime} onChange={(e) => set({ preferredTime: e.target.value })} placeholder="e.g. weekdays after 5pm" className={fieldCls} /></label>
        <label className="block md:col-span-2"><span className={labelCls}>Notes</span>
          <textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} rows={4} className={fieldCls} /></label>
      </div>
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </AdminModal>
  );
}
