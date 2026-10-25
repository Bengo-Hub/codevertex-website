'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Trash2, MessageCircle, Mail, RotateCw } from 'lucide-react';
import { enquiryTopicLabel } from '@/config/services';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AdminPageHeader } from './AdminPageHeader';
import { DataTable, type Column } from './DataTable';
import { authedFetch } from '@/lib/auth/authed-fetch';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  source: string;
  noticeSentAt: string | null;
  createdAt: string;
}

interface PageData { total: number; page: number; pages: number; items: Contact[] }

export function ContactsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), ...(search ? { search } : {}) });
    const res = await authedFetch(`/api/admin/contacts?${params}`);
    setData(res.ok ? await res.json() : null);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  async function confirmDelete() {
    if (!deleting) return;
    const res = await authedFetch(`/api/admin/contacts/${deleting.id}`, { method: 'DELETE' });
    if (res.ok) toast.success('Submission deleted');
    else toast.error('Could not delete the submission');
    setDeleting(null);
    load();
  }

  const [resending, setResending] = useState<string | null>(null);
  async function resend(row: Contact) {
    setResending(row.id);
    const res = await authedFetch(`/api/admin/contacts/${row.id}/resend`, { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    if (res.ok) toast.success(`Acknowledgement sent to ${row.name}`);
    else toast.error(body.error ?? 'Could not send the acknowledgement');
    setResending(null);
    load();
  }

  const waLink = (phone: string) => `https://wa.me/${phone.replace(/[^\d]/g, '').replace(/^0/, '254')}`;

  const columns: Column<Contact>[] = [
    {
      key: 'name',
      header: 'Contact',
      render: (row) => (
        <div>
          <p className="font-medium text-sm text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
          {row.phone && <p className="text-xs text-muted-foreground">{row.phone}</p>}
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Service',
      render: (row) => <span className="text-xs text-muted-foreground">{enquiryTopicLabel(row.service) ?? 'Not given'}</span>,
    },
    {
      key: 'noticeSentAt',
      header: 'Acknowledgement',
      render: (row) =>
        row.noticeSentAt ? (
          <span className="text-xs text-emerald-700 dark:text-emerald-400">Sent {new Date(row.noticeSentAt).toLocaleDateString('en-GB')}</span>
        ) : (
          <span className="text-xs text-destructive">Not sent</span>
        ),
    },
    {
      key: 'message',
      header: 'Message',
      render: (row) => (
        <div className="max-w-xs">
          {expanded === row.id ? (
            <p className="text-xs text-foreground whitespace-pre-wrap">{row.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground truncate">{row.message}</p>
          )}
          {row.message.length > 80 && (
            <button
              onClick={() => setExpanded(expanded === row.id ? null : row.id)}
              className="text-xs text-primary hover:underline mt-0.5"
            >
              {expanded === row.id ? 'Collapse' : 'Expand'}
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (row) => <span className="text-xs capitalize text-muted-foreground">{row.source}</span>,
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (row) => <span className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleDateString('en-GB')}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <a href={`mailto:${row.email}?subject=${encodeURIComponent('Re: your enquiry to Codevertex')}`} title="Reply by email" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Mail className="h-3.5 w-3.5" /></a>
          {row.phone && (
            <a href={waLink(row.phone)} target="_blank" rel="noreferrer" title="WhatsApp" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><MessageCircle className="h-3.5 w-3.5" /></a>
          )}
          {row.phone && (
            <button onClick={() => resend(row)} disabled={resending === row.id} title={row.noticeSentAt ? 'Send the acknowledgement again' : 'Send the acknowledgement'} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"><RotateCw className={`h-3.5 w-3.5 ${resending === row.id ? 'animate-spin' : ''}`} /></button>
          )}
          <button onClick={() => setDeleting(row)} title="Delete" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <AdminPageHeader title="Contact Submissions" description={`${data?.total ?? 0} submissions`} />
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, service…"
          className="w-full max-w-sm pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        keyField="id"
        total={data?.total}
        page={data?.page}
        pages={data?.pages}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No contact submissions yet."
      />
      <ConfirmDialog open={deleting !== null} title={`Delete the message from ${deleting?.name ?? 'this contact'}?`} description="This can't be undone." confirmLabel="Delete" onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
