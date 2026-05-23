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
→ Treasury webhook → updates enrollment payment_status
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
# TREASURY.payUrl = 'https://books.codevertexitsolutions.com/pay'
```

### Webhook Handler (Future — Sprint 8)

Currently payment status is NOT automatically updated from Treasury webhooks. The website should add:

```typescript
// POST /api/webhooks/treasury
// Validate X-Treasury-Signature header
// Update enrollments SET payment_status = 'succeeded' WHERE payment_ref = ?
```

Reference: Treasury webhook signature verification pattern from `ordering-service/ordering-backend/internal/platform/treasury/webhook.go`

---

## 2. Anthropic Claude API (Vera Chatbot)

### Configuration

```typescript
// /api/chat/route.ts
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await anthropic.messages.stream({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 1024,
  system: VERA_SYSTEM_PROMPT,
  messages: userMessages,
});
```

### Model Selection

| Use Case | Model | Reason |
|----------|-------|--------|
| Vera chatbot | `claude-haiku-4-5-20251001` | Fast response, low cost per token |
| Future: content generation | `claude-sonnet-4-6` | Better quality for marketing copy |

### System Prompt Structure

```
You are Vera, the AI assistant for Codevertex Africa Limited...

COMPANY:
- Founded 2020, Kisumu, Kenya
- Products: Power Suite (ERP, POS, TruLoad, ISP Billing, Notifications, Books)
- Academy: Digitika (ICDL, CCNA, AI, Software Engineering, Data Analytics)

COURSES:
[Full course list with prices and durations]

CONTACT:
- WhatsApp: +254 743 793 901
- Email: info@codevertexitsolutions.com
- Address: Pioneer House, 2nd Floor, Kisumu

ESCALATION:
When user wants to speak to human, direct to WhatsApp.
```

### Cost Optimisation (Planned Sprint 8)

Add prompt caching with `cache_control: { type: "ephemeral" }` on the system prompt block:
```typescript
system: [
  {
    type: "text",
    text: VERA_SYSTEM_PROMPT,
    cache_control: { type: "ephemeral" }
  }
]
```
Expected cache hit rate: ~80% (system prompt rarely changes)

---

## 3. Auth Service (SSO) Integration

### Current State

The marketing website does **not** enforce authentication. It links to the SSO portal for existing clients.

```typescript
// lib/constants.ts
export const SSO_URL = 'https://accounts.codevertexitsolutions.com';
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
const JWKS_URL = 'https://sso.codevertexitsolutions.com/api/v1/.well-known/jwks.json';
const AUTH_AUDIENCE = 'codevertex';
const AUTH_ISSUER = 'https://sso.codevertexitsolutions.com';
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

## 6. Email Notifications (Planned Sprint 8)

On successful enrollment, send confirmation email via notifications-api:

```typescript
// S2S call to notifications-api
await fetch('https://notificationsapi.codevertexitsolutions.com/api/v1/s2s/email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.INTERNAL_SERVICE_KEY,
  },
  body: JSON.stringify({
    to: enrollment.email,
    template: 'digitika_enrollment_confirmed',
    data: { courseName, studentName, amount },
  }),
});
```

Trigger: Treasury webhook `payment_status: succeeded`
