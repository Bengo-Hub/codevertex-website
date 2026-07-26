# Codevertex Website — Architecture

## System Overview

```
                    ┌─────────────────────────────────────────┐
                    │         codevertexafrica.com         │
                    │         (codevertex-website)             │
                    │         Next.js 16.2 / React 19          │
                    └─────────────────┬───────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
    ┌─────────▼─────────┐  ┌─────────▼─────────┐  ┌────────▼────────┐
    │   PostgreSQL 17    │  │  Claude Haiku 4.5  │  │  Treasury API   │
    │  (contact_sub,     │  │  (Vera chatbot)    │  │  (Paystack +    │
    │  enrollments,      │  │  Anthropic API     │  │   M-Pesa)       │
    │  leads)            │  └────────────────────┘  └─────────────────┘
    └────────────────────┘
```

## Application Layers

### 1. Presentation Layer (React Server + Client Components)

**Server Components (default):**
- All page files (`page.tsx`)
- Static sections: `DigitikaHero`, `TrustSection`, `CTASection`, `ServicesSection`
- Layout: `Navbar`, `Footer`

**Client Components (`'use client'`):**
- `HeroSection` — framer-motion animations
- `CourseCatalog` — category filter state
- `CourseCard` — expand/collapse state
- `EnrollmentModal` — multi-step form state
- `ChatBot` — conversation state
- `ThemeToggle` — next-themes state

### 2. API Layer (Next.js Route Handlers)

```
src/app/api/
├── chat/route.ts          POST  → Anthropic API (Claude Haiku 4.5)
├── contact/route.ts       POST  → PostgreSQL (contact_submissions)
├── enrollments/route.ts   POST  → PostgreSQL (enrollments)
└── leads/route.ts         POST  → PostgreSQL (leads)
```

**Route Handler Pattern:**
```typescript
export async function POST(req: Request) {
  const body = await req.json();
  // validate with Zod
  // write to DB
  return Response.json({ success: true }, { status: 201 });
}
```

### 3. Data Layer (PostgreSQL + Prisma ORM)

See schema below. Prisma 7 ORM with `@prisma/adapter-pg` driver; connection URL configured in `prisma.config.ts`.

---

## Database Schema

### `contact_submissions`
```sql
CREATE TABLE IF NOT EXISTS contact_submissions (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  service     TEXT,
  message     TEXT NOT NULL,
  source      TEXT DEFAULT 'website',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `enrollments`
```sql
CREATE TABLE IF NOT EXISTS enrollments (
  id              BIGSERIAL PRIMARY KEY,
  course_id       TEXT NOT NULL,
  course_name     TEXT NOT NULL,
  category        TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL,
  dob             DATE,
  experience      TEXT,
  how_heard       TEXT,
  amount          INTEGER NOT NULL,
  currency        TEXT DEFAULT 'KES',
  payment_ref     TEXT,
  payment_status  TEXT DEFAULT 'pending',
  payment_plan    TEXT,          -- 'upfront' | '2-installments' | '3-installments'
  installment_no  INTEGER,       -- which installment (1, 2, 3)
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrollments_email ON enrollments(email);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(payment_status);
```

### `leads`
```sql
CREATE TABLE IF NOT EXISTS leads (
  id             BIGSERIAL PRIMARY KEY,
  name           TEXT,
  email          TEXT,
  phone          TEXT,
  topic          TEXT,
  preferred_time TEXT,
  source         TEXT DEFAULT 'chatbot',
  notes          TEXT,
  status         TEXT DEFAULT 'new',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_submissions(created_at DESC);
```

**Planned additional tables (Sprint 8 — Prisma migration):**
```sql
-- Course cohort management
CREATE TABLE cohorts (
  id          BIGSERIAL PRIMARY KEY,
  course_id   TEXT NOT NULL,
  name        TEXT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE,
  max_slots   INTEGER DEFAULT 20,
  status      TEXT DEFAULT 'open',   -- open | full | closed | completed
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Link enrollments to cohorts
ALTER TABLE enrollments ADD COLUMN cohort_id BIGINT REFERENCES cohorts(id);
```

---

## API Endpoints

### `POST /api/contact`

**Request:**
```json
{
  "name": "string (required)",
  "email": "string (required, email)",
  "phone": "string (optional)",
  "service": "string (optional)",
  "message": "string (required, min 10 chars)"
}
```

**Response 201:**
```json
{ "success": true }
```

**Response 400:**
```json
{ "error": "Validation failed", "details": [...] }
```

---

### `POST /api/enrollments`

**Request:**
```json
{
  "fullName": "string (required)",
  "email": "string (required, email)",
  "phone": "string (required)",
  "dob": "string (date, required)",
  "experience": "string (optional)",
  "howHeard": "string (optional)",
  "courseId": "string (required)",
  "courseName": "string (required)",
  "category": "string (required)",
  "amount": "number (required)",
  "currency": "string (default: KES)",
  "paymentPlan": "string (optional)"
}
```

**Response 201:**
```json
{ "success": true, "enrollmentId": 42 }
```

**Side effects:**
- Saves record with `payment_status: pending`
- Client then redirects to Treasury pay URL

---

### `POST /api/leads`

**Request:**
```json
{
  "name": "string (optional)",
  "email": "string (optional)",
  "phone": "string (optional)",
  "topic": "string (optional)",
  "preferredTime": "string (optional)",
  "notes": "string (optional)"
}
```

**Response 201:**
```json
{ "success": true }
```

---

### `POST /api/chat`

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Tell me about CCNA courses" }
  ]
}
```

**Response (Server-Sent Events stream):**
```
data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"The "}}
data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"CCNA..."}}
data: [DONE]
```

**Model:** `claude-haiku-4-5-20251001`  
**System prompt:** Includes full course catalog, pricing, company info, escalation instructions

---

## Infrastructure

### Kubernetes Deployment

```
Namespace: codevertex
Service: codevertex-website (ClusterIP :3000)
Ingress: nginx → codevertexafrica.com (TLS: letsencrypt-prod)
Image: docker.io/codevertex/codevertex-website:<git-sha>
Replicas: 1 (autoscale 1–2)
Resources: 50m CPU / 128Mi RAM (requests), 200m / 256Mi (limits)
```

### Secret Management

```
K8s Secret: codevertex-website-secrets
  DATABASE_URL           PostgreSQL connection string
  ANTHROPIC_API_KEY      Claude API key
```

### Health Checks

```
GET /healthz   → 200 OK { "status": "ok" }
Readiness: initialDelay 10s, period 10s, failureThreshold 6
Liveness:  initialDelay 30s, period 15s, failureThreshold 3
```

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ORM | Raw `pg` client | Minimal deps; marketing site has 3 simple tables |
| Payment | Treasury redirect (no iframe) | Simplest integration; treasury handles PCI compliance |
| AI model | Claude Haiku 4.5 | Fast, cheap, sufficient for FAQ chatbot |
| Auth | None (marketing site) | No login wall; SSO link → accounts subdomain |
| Image storage | `/public/images/` | No CDN needed at current scale |
| Build output | `standalone` | ~50% smaller Docker image vs default |
