# codevertex-website

The public website of Codevertex Africa Limited (codevertexafrica.com), Digitika Academy's course
catalogue, enrolment and learning portal, and the staff admin panel.

Next.js 16 (App Router), React 19, Tailwind CSS 4, Prisma 7 on PostgreSQL, pnpm.

## Pages

| Route | What it shows |
|-------|---------------|
| `/` | What we do, live customers, the 14 Power Suite products with live prices, field work and recent projects, services, Digitika, company facts |
| `/services` | Every product and service in detail; `#<product id>` anchors |
| `/pricing` | Live monthly prices from subscriptions-api |
| `/integrations` | KRA eTIMS, payments, weighbridges, ANPR, CCTV, PLC and IoT work |
| `/projects`, `/projects/[slug]` | Delivered projects with photos (database) |
| `/about`, `/contact` | Company details; contact form with required phone |
| `/blog`, `/careers`, `/careers/attachment` | Posts (database), roles (erp-api), attachment applications |
| `/digitika/**`, `/student`, `/certificates/[token]` | Academy catalogue, enrolment, learner and parent portals, certificate check |
| `/admin/**` | Staff panel (SSO and Digitika RBAC); `/admin/platform` holds the internal architecture map |

## Where things live

- Products, services and contact topics: `src/config/services.ts` (one list for every page, the footer,
  the contact form and `/api/catalog`).
- Design tokens and rules: `docs/ux-ui.md`. Photo sources: `docs/image-credits.md`.
- Integrations (treasury, SSO, notifications, catalogue): `docs/integrations.md`.
- Architecture and schema: `docs/architecture.md`, `prisma/schema.prisma`.

Data the site reads from other services: live customers from auth-api (`src/lib/tenants.ts`), prices
from subscriptions-api (`src/lib/subscriptions.ts`), careers from erp-api (`/api/erp` proxy). Notices
(email and WhatsApp) are events on NATS (`src/lib/events.ts`), sent by notifications-api.

## Running locally

```bash
pnpm install
cp .env.example .env.local   # fill in DATABASE_URL and the values described in the file
pnpm exec prisma generate
pnpm exec prisma db push
pnpm dev                      # http://localhost:3000
```

Checks before a commit: `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Deployment

A push to `main` builds the Docker image (`Dockerfile`, standalone output) and updates
`devops-k8s` (`apps/codevertex-website/values.yaml`); ArgoCD deploys it. On start the container runs
`prisma db push`, then the idempotent seed (courses, cohorts, blog posts, projects with their photos
from `prisma/seed/project-photos/`), then the server.
