# Codevertex Website — Integrations

## 1. Treasury Payment Integration

### Overview

Digitika course payments flow through the Codevertex Treasury service (same system used by ordering-service, POS, and subscriptions). The website does **not** call Treasury API server-to-server — it performs a simple browser redirect to the Treasury pay page.

### Payment Flow

```
Enrollment Modal (Step 2)
→ "Proceed to Payment" clicked
→ POST /api/enrollments (saves pending record to DB)
→ window.open(TREASURY_PAY_URL + queryParams, '_blank')
→ User pays via M-Pesa or Paystack on Treasury UI
→ treasury.payment.succeeded (NATS) → treasury-subscriber.ts updates enrollment payment_status
```

### URL Construction

```typescript
const params = new URLSearchParams({
  amount:         String(course.price),
  tenant:         process.env.NEXT_PUBLIC_TREASURY_TENANT ?? 'codevertex',
  reference_id:   `digitika-${course.id}-${Date.now()}`,
  reference_type: 'digitika_enrollment',
  currency:       course.currency,
  description:    `Digitika — ${course.name}`,
  redirect_url:   `${window.location.origin}/digitika/success`,
  button_text:    'View My Enrollment',
  gateways:       'paystack,mpesa',
});
window.open(`${TREASURY_PAY_URL}?${params}`, '_blank');
```

### Environment Variables

```env
NEXT_PUBLIC_TREASURY_TENANT=codevertex
# Treasury pay URL is hardcoded in lib/constants.ts:
# TREASURY.payUrl = 'https://books.codevertexafrica.com/pay'
```

### Payment Confirmation (NATS, not HTTP webhook)

treasury-api has no outbound HTTP webhook dispatcher — it only publishes events over NATS
JetStream via the shared-events transactional outbox. Payment confirmation is consumed here by
`src/lib/treasury-subscriber.ts`, a durable JetStream consumer (`codevertex-website-treasury`)
filtered on subject `treasury.payment.succeeded`, started from `instrumentation.ts` when
`EVENTS_NATS_URL` is set.

On a matching event (`reference_type: "digitika_enrollment"`), the subscriber marks the next
installment paid, updates the enrollment, and publishes `digitika.payment.succeeded` (consumed
by notifications-api's `digitika_consumer` to send the payment receipt email).

**Idempotency note**: the event payload's `provider_reference` field is not guaranteed present
(omitted for cash/manual/till settlements) or unique — do not key dedup logic on it. The event
envelope's `id` is the reliable dedup key; see
[docs.codevertexafrica.com/platform-standards/idempotency-and-outbox](https://docs.codevertexafrica.com/platform-standards/idempotency-and-outbox).

There is no `/api/webhooks/treasury` HTTP route — an earlier version of this integration assumed
one, but treasury never called it, and the working payment-confirmation path is the NATS
subscriber described above.

---

### Payments received outside the website (Oct 2026)

Bank deposits, cash, cheques and M-Pesa sent straight to the till are recorded by an admin
("Record payment" on the Enrollments and Installments pages, permission
`digitika.installments.manage`): `POST /api/admin/enrollments/{id}/payments`
`{ amount, method, reference, paidAt }`.

1. Treasury books it first: S2S `POST /api/v1/s2s/{tenant}/accounts/{receipt reference}/manual-payments`
   (a succeeded `account_payment` intent with source `codevertex-website`, in the course
   currency). Treasury refuses the same method and reference twice, which catches a slip
   entered twice. If treasury is down nothing is recorded.
2. `src/lib/enrollment-payments.ts applyEnrollmentPayment` applies it, the same allocator the
   treasury subscriber uses for online payments: the payment becomes the next unpaid
   installment at the amount received, and the balance is spread over the remaining
   installments, keeping their due dates. A shortfall moves onto later installments (or a new
   one on the same due date); an overpayment shrinks them and removes the ones no longer owed.
   A part-paid upfront enrollment gets a schedule (the payment, then the balance due in 28 days).
3. The student gets the usual receipt event, and portal accounts if it was the first payment.

Payment status follows the money and is never typed in. Only the allocator (a payment) and a
free course set `succeeded`; `PATCH /api/admin/enrollments/{id}` refuses `succeeded` and
`refunded` (refunds are made in treasury) and refuses any status change once money has been
received, so an enrollment can neither be marked paid with nothing in the books nor have real
payments hidden. With nothing received, an admin can still flip pending and failed (an
abandoned checkout). "Payment already collected" when enrolling a student goes through the same
treasury-first path and needs the method and a reference.

The old student-callable `POST /api/enrollments/{id}/sync` is gone: it marked installments paid
without treasury knowing.

## 2. Vera Chatbot (marketflow-ai widget)

**Superseded architecture note:** this section previously described a direct Anthropic API call
from a `/api/chat/route.ts` handler in this repo. That route no longer exists — Vera has since
moved to a standalone, embeddable widget backed by its own service (`marketflow-ai`), shared
across every Codevertex property, not something this repo calls directly. Documenting the
current shape below.

### Embedding

```tsx
// src/app/layout.tsx
<script
  async
  src="https://marketflow.codevertexafrica.com/widget/chat.js"
  data-tenant="codevertex"
  data-mode="platform"
  data-business-type="codevertex"
  data-api-url="https://marketflowai.codevertexafrica.com"
  data-primary-color="#9100B0"
  data-accent-color="#b800e0"
  data-widget-title="Vera"
  data-whatsapp="254743793901"
  data-phone="+254743793901"
/>
```

The widget script (served by `marketflow-ui`) renders the chat bubble/panel client-side and talks
directly to `marketflowai.codevertexafrica.com` (the `marketflow-ai` backend) — this website never
proxies or calls an LLM API itself.

### Backend (marketflow-ai)

A Go service, not a Next.js API route. LLM calls are Groq-primary (OpenAI-compatible endpoint),
with Claude and a local Ollama model as configured fallbacks:

| Role | Model | Provider |
|---|---|---|
| Main response generation | `llama-3.3-70b-versatile` | Groq |
| Intent routing / classification | `llama-3.1-8b-instant` | Groq |
| Fallback | `claude-haiku-4-5-20251001` | Anthropic |

It runs a tool-calling agent loop (not a single system-prompt completion) — tools include, among
others, requesting a platform integration (eTIMS and beyond) on the visitor's behalf, which files
an `IntegrationRequest` in auth-api and notifies the platform team via the same Slack/email
pipeline used elsewhere in the fleet. See `marketflow-ai/internal/agent/tools/` and
`marketflow-ai/internal/ai/router.go` for the current tool/intent set — this doc intentionally
doesn't duplicate that list since it changes independently of this website.

### Escalation

When a visitor wants a human, the agent directs them to WhatsApp — `data-whatsapp`/`data-phone`
above are exactly the contact details it escalates to.

---

## 3. Auth Service (SSO) Integration

### Current State

The marketing website does **not** enforce authentication. It links to the SSO portal for existing clients.

```typescript
// lib/constants.ts
export const SSO_URL = 'https://accounts.codevertexafrica.com';
```

```tsx
// Navbar.tsx
<Link href={SSO_URL} target="_blank">Client portal →</Link>
```

### Student and parent accounts (Oct 2026)

Students and parents have SSO accounts in auth-api under the platform tenant (`codevertex`),
with roles kept apart from staff:

| Role | Who | How the account is made | Where they go |
|------|-----|-------------------------|---------------|
| `student` | the learner | `src/lib/portal-accounts.ts` once the enrollment is confirmed | `/student` |
| `parent` | guardian of a learner under 18 | same run, from the guardian on the student record | `/digitika/parent`, picks a child (see section 8) |
| `digitika_admin`, `digitika_staff`, `digitika_instructor` | Digitika team | admin Users page only | `/admin`, by permission |

"Confirmed" means the first payment cleared (treasury subscriber), a free course, an admin
marking the enrollment paid, or an admin recording a deposit. Abandoned checkouts never create
accounts.

Provisioning calls auth-api `POST /api/v1/s2s/tenants/{platform tenant id}/members` with
`roles`, `merge_roles: true` (a learner who is also staff keeps their staff roles) and
`skip_welcome: true`. auth-api returns the real auth user id, stored on
`StudentUser.ssoUserId` (or `guardianSsoUserId` for the parent), and a temporary password only
when the account is new. The website publishes `digitika.account.created`; notifications-api sends `digitika/portal_account`
with the login link and that password by email, and a WhatsApp notice (no password) when the
account owner has a phone. auth-ui makes the person choose their own password on
first sign-in, even when they arrive through the website's redirect.

Resend access: the Students admin page has a key button on any student with a portal account.
It calls `POST /api/admin/students/{id}/resend-access` with `{who: "student" | "parent"}`, which
asks auth-api `POST /api/v1/s2s/tenants/{tenant}/members/{user}/portal-password` for a new
temporary password and republishes `digitika.account.created`, so the person gets the credentials
by email and the account notice on WhatsApp again. auth-api only allows it while the person is
still on the temporary password and holds only student or parent roles; a person who already
chose their own password gets a clear message and should use the password reset email.

Claims on `ssoUserId` and `guardianSsoUserId` are conditional updates, so repeated payment
events never send credentials twice. A new guardian email on a later enrollment clears
`guardianSsoUserId`, and the new guardian gets their own account.

Students are matched to their SSO account by email. Student emails are stored lowercased;
`findStudentByEmail` also finds older rows that kept capitals. A signed-in account with no
student record goes to the parent portal when it is someone's guardian, else sees "No
enrollment on this account".

## 4. PostgreSQL Database

### Connection

```typescript
// lib/db.ts
import { Pool } from 'pg';

let pool: Pool;

export function getDB(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}
```

### Usage in Route Handlers

```typescript
import { getDB } from '@/lib/db';

const db = getDB();
const { rows } = await db.query(
  'INSERT INTO enrollments (...) VALUES ($1, $2, ...) RETURNING id',
  [courseId, courseName, ...]
);
```

### Production Database

- **Engine:** PostgreSQL 17
- **Host:** PostgreSQL service in Kubernetes `infra` namespace
- **Connection:** Via `DATABASE_URL` secret (pgBouncer connection pooling in cluster)
- **Schema migration:** Apply `scripts/schema.sql` on first deploy; manual for now
- **Planned:** Migrate to Prisma with Atlas migrations in Sprint 8

---

## 5. Shared UI Lib (Future)

The `@bengo-hub/shared-ui-lib` package provides `TreasuryPaymentModal` — an iframe-embedded payment modal used in ordering-frontend and pos-ui.

**Current decision:** Not used in codevertex-website. Reasons:
1. Marketing site uses simple treasury redirect, not embedded modal
2. Avoids npm package auth complexity for public marketing site
3. Simpler UX: opens new tab, keeps main page unaffected

**If embedded payment is needed in future:**
```typescript
import { TreasuryPaymentModal } from '@bengo-hub/shared-ui-lib/payments';

<TreasuryPaymentModal
  open={modalOpen}
  onOpenChange={setModalOpen}
  paymentIntentId={intentId}
  tenantSlug="codevertex"
  amount={course.price}
  currency="KES"
  allowedMethods="paystack,mpesa"
  onPaymentConfirmed={(result) => { /* update enrollment */ }}
/>
```

Registry: `https://npm.pkg.github.com` (requires `NPM_TOKEN` / `GH_PAT`)

---

## 6. Notifications (email and WhatsApp)

`src/lib/events.ts` publishes platform-standard envelope events to NATS subject `digitika.{event_type}`.
notifications-api's `digitika_consumer` is the only sender (no HTTP fallback, so nothing is sent twice
or worded differently). Events: `enrollment.confirmed`, `payment.succeeded`, `installment.reminder`,
`account.created`, `access_code.requested`, `contact.received`, `certificate.issued`. Learner events
carry the learner's and the guardian's contacts (`src/lib/notice-contacts.ts`; a child's placeholder
email is never sent), and the consumer tells each person on the email and WhatsApp contacts they have,
so for a minor both the child and the parent are reached. SMS is not used.

Reminders (`src/lib/installment-reminders.ts`, run daily at 08:00 by the `digitika-installment-reminder`
CronJob and by the admin's manual Send reminder): an installment is reminded when it is unpaid and due
within 3 days or overdue, at most once a day before the due date and every 3 days once overdue. The
installment row decides whether it is owed: the enrollment's own status is already `succeeded` after the
first payment, so it never does (the old check skipped every part-paid enrollment, so no installment
reminder was ever sent). A row is marked reminded only after the event was published, so a NATS outage
retries on the next run. Batches of 100 by id, at most 2,000 per run, served by the `(status, due_date)`
index.

Trigger for the payment receipt: `treasury.payment.succeeded` (NATS) -> `treasury-subscriber.ts` ->
`publishInstallmentPaid`.

---

## 7. Course Catalog Data Model (DB single source of truth)

- Every section of `/digitika/[courseId]` comes from the `courses` row. Page-only content lives in `Course.metadata` (JSON, shape `CourseMetadata` in `src/types/course.ts`): `curriculum`, `testimonials`, `showAlumni`, `brochure`, `location`, `cohortSize`, `ageRange`, `schedule`, `requirements`, `highlights`. Keys starting with `_` are system-owned (`_seedVersion`).
- `src/config/courses.ts` holds only category display metadata (`COURSE_CATEGORIES`, `getCategory()`) and shared helpers (`planKey`, `findInstallmentPlan`, `computeDueDates`). No per-course data.
- Admin: `/admin/courses` edits all fields in four tabs (Details, Page content, Curriculum, Pricing) and can create courses. "Import from LMS modules" builds the curriculum from the course's LMS modules and lessons so the website outline matches what is delivered.
- API: `POST /api/admin/courses`, `PATCH /api/admin/courses/[id]` share one Zod schema (`src/lib/course-schema.ts`). Metadata patches are merged, so system keys survive.
- Kids & Teens category (`kids`): Tech Explorers (6-10, KES 8,000), Young Innovators: Game Development & Python (10-16, KES 15,000), Young Innovators: Robotics, IoT & AI (10-16, KES 15,000). Module mix benchmarked against Kenyan providers and the KICD coding / digital literacy strands.

---

## 8. Parent Portal (account or one-time code)

Route: `/digitika/parent`. Parents track progress and pay fee arrears either with their parent account (signed in, they pick a child) or with the Student ID plus a one-time code. Both ways end in the same `cv_parent` session for one child, so overview and pay have one code path.

| Step | Endpoint | Notes |
|------|----------|-------|
| Request code | `POST /api/parent/request-code` `{ studentId }` | 6-digit code sent to the parent or guardian on file (the learner when there is none), by email and WhatsApp (`auth_otp`, platform number) through the `digitika.access_code.requested` event. Returns masked destinations only. |
| Verify | `POST /api/parent/verify` `{ studentId, code }` | Sets `cv_parent` cookie (httpOnly, SameSite=Strict, 30 min, purpose-scoped HMAC). |
| Overview | `GET /api/parent/overview` | Per-course progress (one grouped SQL query, `src/lib/student-progress.ts`), quiz results, certificates, announcements, balances and arrears. No email, phone or DOB returned. |
| Pay | `POST /api/parent/pay` `{ enrollmentId, installmentNo? }` | Server builds the treasury pay link; amount comes from the DB; only the session student's enrollments. |
| Sign out | `POST /api/parent/logout` | Clears the cookie. |
| Account children | `GET /api/parent/account` | Signed-in parent account: children whose `guardianEmail` is the account email (indexed), names and Student IDs only. |
| Open a child | `POST /api/parent/account` `{ studentId }` | Same session as Verify, only for a child that named this account; "not yours" and "no such student" both answer 404. |

Security and data protection (Kenya Data Protection Act 2019 principles): codes are random, single-use, expire in 5 minutes, stored only as a keyed HMAC, max 5 guesses per code; rate limits of 3 codes per student per hour and 10 requests per IP per hour, DB-backed (`parent_access_codes`, IP stored as a keyed hash) so they hold across pods; every request is an audit row, pruned after 30 days. Requires `SESSION_SECRET`, `INTERNAL_SERVICE_KEY` and `NOTIFICATIONS_API_URL`. `SESSION_SECRET` lives in the `codevertex-website-secrets` cluster secret and is generated once (then preserved) by devops-k8s `scripts/infrastructure/create-service-secrets.sh` during the website deploy; without it every code request and every website SSO session fails with a 500 ("SESSION_SECRET must be set in production" in the pod log, 2026-10-20 incident).

Account emails: the portal account email (`digitika/portal_account`, temporary password) is exempt from notifications-api's unverified-account email gate, because a new learner or guardian account is unverified by definition. Resending access reissues the password, so only the newest email works; the older email's password stops working at once.

Related hardening: `GET /api/enrollments/[id]/summary` now requires `?reference=DGT-{id}-DGT-{studentId}` (the receipt reference); previously any sequential id exposed another student's details.


---

## 9. Public Catalog (/digitika)

The catalog sits directly under the hero (`#courses`) and follows the patterns of the large course platforms (Coursera, Codecademy, DataCamp): keyword search plus facets, category tabs, sort, visible active filters and result counts.

- **Tabs:** "All courses" plus one tab per category that has active courses, each with a live count. Under "All" with the recommended sort, courses are grouped by category with an "Only <category>" shortcut.
- **Search:** name, short name, description, stack, audience and outcomes; all terms must match.
- **Filters:** level, format (in-person, online, hybrid, parsed from `mode`), duration (up to 4, 5 to 8, 9+ weeks), price (under 10k, 10k to 25k, over 25k), and age group (from `metadata.ageRange`). Facets are derived from course fields, so admins never maintain tags. Options no course in the current tab can match are hidden, and counts reflect the other active filters.
- **Sort:** recommended (category order, featured, sortOrder), price either way, shortest first, name.
- **Shareable URLs:** `?category=&q=&level=&format=&duration=&price=&age=&sort=`. These are updated with `history.replaceState`, so filtering is instant and never re-renders the page on the server. Legacy `#<categoryId>` links open the matching tab.
- Logic lives in `src/lib/course-catalog-filters.ts` (unit tested); UI lives in `src/components/digitika/CourseCatalogClient.tsx`.
