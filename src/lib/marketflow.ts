// MarketFlow owns leads and contacts for every Codevertex tenant (owner, 2026-11-24). The website
// keeps no lead, enquiry or newsletter table: its forms and its admin read and write MarketFlow
// over the service API (X-API-Key), and nothing is cached here beyond the one request.

const MARKETFLOW_API_URL = (
  process.env.MARKETFLOW_API_URL ?? 'http://marketflow-api.marketflow.svc.cluster.local:4000'
).replace(/\/$/, '');
/** The tenant the website's leads belong to, by slug. */
const MARKETFLOW_TENANT = process.env.MARKETFLOW_TENANT ?? 'codevertex';

/** Sources the website's enquiry forms write; the admin's Contacts page lists these. */
export const ENQUIRY_SOURCES = ['website_contact', 'website_attachment'] as const;
/** Every lead status but lost: what the Contacts page shows. */
export const OPEN_STATUSES = ['new', 'contacted', 'qualified', 'converted'] as const;
export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'] as const;

export class MarketFlowError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const key = process.env.INTERNAL_SERVICE_KEY;
  if (!key) throw new MarketFlowError(500, 'INTERNAL_SERVICE_KEY is not set');
  const res = await fetch(`${MARKETFLOW_API_URL}/api/v1${path}`, {
    method,
    headers: {
      'X-API-Key': key,
      'X-Tenant-ID': MARKETFLOW_TENANT,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new MarketFlowError(res.status, `MarketFlow ${method} ${path}: ${res.status} ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

/** A lead as MarketFlow returns it (the fields the website uses). */
export interface MFLead {
  id: string;
  email?: string | null;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  source: string;
  status: string;
  score: number;
  interest?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

interface MFPage<T> {
  data: T[];
  total: number;
  limit: number;
  page: number;
}

export interface LeadQuery {
  page?: number;
  limit?: number;
  q?: string;
  status?: readonly string[];
  source?: readonly string[];
  excludeSource?: readonly string[];
}

function query(q: LeadQuery): string {
  const p = new URLSearchParams();
  if (q.page) p.set('page', String(q.page));
  if (q.limit) p.set('limit', String(q.limit));
  if (q.q) p.set('q', q.q);
  if (q.status?.length) p.set('status', q.status.join(','));
  if (q.source?.length) p.set('source', q.source.join(','));
  if (q.excludeSource?.length) p.set('exclude_source', q.excludeSource.join(','));
  const s = p.toString();
  return s ? `?${s}` : '';
}

export interface LeadInput {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  interest?: string | null;
  source: string;
  metadata?: Record<string, unknown>;
  /** UTM tags of the visit that sent the enquiry (lead columns in MarketFlow). */
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

/** First word as the first name, the rest as the last name. */
export function splitName(name?: string | null): { first_name?: string; last_name?: string } {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  return { first_name: parts[0], ...(parts.length > 1 ? { last_name: parts.slice(1).join(' ') } : {}) };
}

export function leadName(l: Pick<MFLead, 'first_name' | 'last_name'>): string | null {
  const n = [l.first_name, l.last_name].filter(Boolean).join(' ').trim();
  return n || null;
}

export function metaString(l: MFLead, key: string): string | null {
  const v = l.metadata?.[key];
  return typeof v === 'string' && v !== '' ? v : null;
}

export const marketflow = {
  listLeads: (q: LeadQuery) => call<MFPage<MFLead>>('GET', `/internal/leads${query(q)}`),
  leadStats: (q: LeadQuery = {}) =>
    call<{ total: number; this_week: number; by_status: Record<string, number>; by_source: Record<string, number> }>(
      'GET',
      `/internal/leads/stats${query(q)}`,
    ),
  getLead: (id: string) => call<{ lead: MFLead }>('GET', `/internal/leads/${encodeURIComponent(id)}`).then((r) => r.lead),
  /** Creates the lead, or records the submission on the person's existing lead (same email or phone). */
  captureLead: (l: LeadInput) =>
    call<{ lead: MFLead; created: boolean }>('POST', '/internal/leads', {
      service_origin: 'codevertex-website',
      source: l.source,
      email: l.email || undefined,
      phone: l.phone || undefined,
      interest: l.interest || undefined,
      ...splitName(l.name),
      metadata: l.metadata ?? {},
      utm_source: l.utm_source || undefined,
      utm_medium: l.utm_medium || undefined,
      utm_campaign: l.utm_campaign || undefined,
    }),
  /** Changes the fields given; metadata is merged key by key (null removes a key). */
  patchLead: (id: string, patch: Record<string, unknown>) =>
    call<MFLead>('PATCH', `/internal/leads/${encodeURIComponent(id)}`, patch),
  /** MarketFlow's delete: the lead is marked lost and keeps its history. */
  deleteLead: (id: string) => call<{ status: string }>('DELETE', `/internal/leads/${encodeURIComponent(id)}`),
  importLeads: (leads: unknown[]) =>
    call<{ results: { external_ref: string; lead_id: string; outcome: string }[]; counts: Record<string, number> }>(
      'POST',
      '/internal/leads/import',
      { leads },
    ),
  /** Upserts contacts by email or phone; subscribed_email records the person's own opt-in. */
  upsertContacts: (contacts: unknown[]) =>
    call<{ created: number; existing: number; failed: number }>('POST', '/internal/contacts/bulk-import', { contacts }),
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isLeadId = (id: string) => UUID_RE.test(id);

/** The admin Leads page row. */
export function toAdminLead(l: MFLead) {
  return {
    id: l.id,
    name: leadName(l),
    email: l.email ?? null,
    phone: l.phone ?? null,
    topic: l.interest ?? null,
    source: l.source,
    status: l.status,
    notes: metaString(l, 'notes'),
    preferredTime: metaString(l, 'preferred_time'),
    score: l.score ?? 0,
    createdAt: l.created_at,
  };
}

/** The admin Contacts page row: an enquiry from the contact or attachment form. */
export function toAdminContact(l: MFLead) {
  return {
    id: l.id,
    name: leadName(l) ?? '',
    email: l.email ?? '',
    phone: l.phone ?? null,
    service: metaString(l, 'service'),
    message: metaString(l, 'message') ?? l.interest ?? '',
    source: metaString(l, 'form') ?? (l.source === 'website_attachment' ? 'attachment' : 'contact'),
    status: l.status,
    noticeSentAt: metaString(l, 'notice_sent_at'),
    createdAt: l.created_at,
  };
}

/** The lead source an enquiry form writes. */
export const enquirySource = (form: string) => (form === 'attachment' ? 'website_attachment' : 'website_contact');

/** Total pages for a MarketFlow page. */
export const pagesOf = (total: number, limit: number) => Math.max(1, Math.ceil(total / Math.max(1, limit)));
