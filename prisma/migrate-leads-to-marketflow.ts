/**
 * One-off move of the website's own lead tables into MarketFlow, which owns leads and contacts
 * (2026-11-24). Run inside the website pod, where DATABASE_URL and INTERNAL_SERVICE_KEY are set:
 *
 *   tsx prisma/migrate-leads-to-marketflow.ts            # dry run: counts only
 *   tsx prisma/migrate-leads-to-marketflow.ts --apply    # sends them
 *
 * Safe to run again: MarketFlow fixes each lead's id from its external_ref, so a second run
 * reports every row as skipped. It keeps each row's created time, status and source, dedupes by
 * email and phone, and sends no new-lead alerts or nurture messages. Newsletter signups become
 * MarketFlow contacts with their email opt-in.
 */
import { Pool } from 'pg';

const apply = process.argv.includes('--apply');
const MF = (process.env.MARKETFLOW_API_URL ?? 'http://marketflow-api.marketflow.svc.cluster.local:4000').replace(/\/$/, '');
const TENANT = process.env.MARKETFLOW_TENANT ?? 'codevertex';
const KEY = process.env.INTERNAL_SERVICE_KEY ?? '';

type Row = Record<string, unknown>;

function nameParts(name: unknown) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return {};
  return { first_name: parts[0], ...(parts.length > 1 ? { last_name: parts.slice(1).join(' ') } : {}) };
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined);
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v ? new Date(String(v)).toISOString() : undefined);
const STATUSES = new Set(['new', 'contacted', 'qualified', 'converted', 'lost']);

async function post(path: string, body: unknown) {
  const res = await fetch(`${MF}/api/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': KEY, 'X-Tenant-ID': TENANT },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path}: ${res.status} ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

async function main() {
  if (apply && !KEY) throw new Error('INTERNAL_SERVICE_KEY is not set');
  const db = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
  const leads = (await db.query('SELECT * FROM leads ORDER BY id')).rows as Row[];
  const contacts = (await db.query('SELECT * FROM contact_submissions ORDER BY id')).rows as Row[];
  const subscribers = (await db.query('SELECT * FROM newsletter_subscribers ORDER BY id')).rows as Row[];
  await db.end();

  const rows = [
    ...leads.map((l) => ({
      external_ref: `codevertex-website:lead:${l.id}`,
      created_at: iso(l.created_at),
      source: str(l.source) ?? 'chatbot',
      status: STATUSES.has(String(l.status)) ? String(l.status) : 'new',
      email: str(l.email),
      phone: str(l.phone),
      interest: str(l.topic),
      ...nameParts(l.name),
      metadata: {
        service_origin: 'codevertex-website',
        ...(str(l.preferred_time) ? { preferred_time: str(l.preferred_time) } : {}),
        ...(str(l.notes) ? { notes: str(l.notes) } : {}),
        website_score: l.score,
      },
    })),
    ...contacts.map((c) => ({
      external_ref: `codevertex-website:contact:${c.id}`,
      created_at: iso(c.created_at),
      source: c.source === 'attachment' ? 'website_attachment' : 'website_contact',
      status: 'new',
      email: str(c.email),
      phone: str(c.phone),
      interest: str(c.service),
      ...nameParts(c.name),
      metadata: {
        service_origin: 'codevertex-website',
        form: str(c.source) ?? 'contact',
        message: str(c.message),
        ...(str(c.service) ? { service: str(c.service) } : {}),
        ...(c.notice_sent_at ? { notice_sent_at: iso(c.notice_sent_at) } : {}),
      },
    })),
  ].filter((r) => r.email || r.phone);

  const optIns = subscribers
    .filter((s) => !s.unsubscribed_at && str(s.email))
    .map((s) => ({
      external_ref: `codevertex-website:newsletter:${s.id}`,
      email: str(s.email),
      contact_type: 'customer',
      subscribed_email: true,
      metadata: { consent_source: `codevertex-website newsletter (${s.source ?? 'footer'})`, consent_at: iso(s.subscribed_at) },
    }));

  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', tenant: TENANT, leads: leads.length, contact_submissions: contacts.length,
    lead_rows_to_send: rows.length, newsletter_subscribers: subscribers.length, newsletter_opt_ins_to_send: optIns.length }));
  if (!apply) return;

  const counts: Record<string, number> = {};
  for (let i = 0; i < rows.length; i += 200) {
    const res = await post('/internal/leads/import', { leads: rows.slice(i, i + 200) });
    for (const [k, v] of Object.entries(res.counts as Record<string, number>)) counts[k] = (counts[k] ?? 0) + v;
  }
  const contactsRes = optIns.length ? await post('/internal/contacts/bulk-import', { contacts: optIns }) : { created: 0, existing: 0, failed: 0 };
  console.log(JSON.stringify({ leads: counts, newsletter: { created: contactsRes.created, existing: contactsRes.existing, failed: contactsRes.failed } }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
