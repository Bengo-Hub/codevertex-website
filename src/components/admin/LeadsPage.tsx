'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { DataTable, type Column } from './DataTable';
import { StatusBadge } from './StatusBadge';
import { toast } from 'sonner';

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  topic: string | null;
  source: string;
  status: string;
  notes: string | null;
  preferredTime: string | null;
  createdAt: string;
}

interface PageData { total: number; page: number; pages: number; items: Lead[] }

const STATUS_OPTIONS = ['', 'new', 'contacted', 'qualified', 'converted', 'lost'];

export function LeadsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), ...(search ? { search } : {}), ...(status ? { status } : {}) });
    const res = await fetch(`/api/admin/leads?${params}`);
    setData(await res.json());
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, newStatus: string) {
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) toast.success(`Lead marked as ${newStatus}`);
    else toast.error('Failed to update status');
    load();
  }

  const columns: Column<Lead>[] = [
    {
      key: 'name',
      header: 'Contact',
      render: (row) => (
        <div>
          <p className="font-medium text-sm text-foreground">{row.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{row.email ?? row.phone ?? '—'}</p>
        </div>
      ),
    },
    { key: 'topic', header: 'Topic', render: (row) => <span className="text-xs text-muted-foreground">{row.topic ?? '—'}</span> },
    { key: 'source', header: 'Source', render: (row) => <span className="text-xs capitalize text-muted-foreground">{row.source}</span> },
    { key: 'preferredTime', header: 'Preferred Time', render: (row) => <span className="text-xs text-muted-foreground">{row.preferredTime ?? '—'}</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'createdAt',
      header: 'Date',
      render: (row) => <span className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleDateString('en-GB')}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) => updateStatus(row.id, e.target.value)}
          className="text-xs rounded border border-border bg-background px-2 py-1 text-foreground"
        >
          {['new', 'contacted', 'qualified', 'converted', 'lost'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <AdminPageHeader title="Leads" description={`${data?.total ?? 0} leads captured`} />
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search leads…" className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground">
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
      </div>
      <DataTable columns={columns} data={data?.items ?? []} keyField="id" total={data?.total} page={data?.page} pages={data?.pages} onPageChange={setPage} loading={loading} emptyMessage="No leads yet." />
    </div>
  );
}
