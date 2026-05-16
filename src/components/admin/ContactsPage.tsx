'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { DataTable, type Column } from './DataTable';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  source: string;
  createdAt: string;
}

interface PageData { total: number; page: number; pages: number; items: Contact[] }

export function ContactsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), ...(search ? { search } : {}) });
    const res = await fetch(`/api/admin/contacts?${params}`);
    setData(await res.json());
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

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
      render: (row) => <span className="text-xs text-muted-foreground">{row.service ?? '—'}</span>,
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
    </div>
  );
}
