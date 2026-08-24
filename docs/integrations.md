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

### Future Integration (Sprint 10)

For a future "Student Portal" or "Client Dashboard" on this domain:

**Token Validation Pattern:**
```typescript
// Reuse auth-service JWKS validation pattern from other services
const JWKS_URL = 'https://sso.codevertexafrica.com/api/v1/.well-known/jwks.json';
const AUTH_AUDIENCE = 'codevertex';
const AUTH_ISSUER = 'https://sso.codevertexafrica.com';
```

**Middleware (planned):**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  if (!token && request.nextUrl.pathname.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

---

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

## 6. Email Notifications

Implemented via `src/lib/events.ts` (`publishInstallmentPaid` / `publishEnrollmentConfirmed`),
which publishes platform-standard envelope events to NATS subject `digitika.{event_type}`,
consumed by notifications-api's `digitika_consumer` for email dispatch. When `EVENTS_NATS_URL`
is unset, routes fall back to a direct S2S call via `src/lib/notifications.ts` to
`POST {NOTIFICATIONS_API_URL}/api/v1/notifications/messages` with `X-API-Key: INTERNAL_SERVICE_KEY`.

Trigger for the payment-receipt email: `treasury.payment.succeeded` (NATS) →
`treasury-subscriber.ts` → `publishInstallmentPaid`.
