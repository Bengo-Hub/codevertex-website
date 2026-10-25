# Codevertex Website — Master Project Plan

## Overview

**Project:** Codevertex Africa Limited Marketing & Academy Website  
**Stack:** Next.js 16.2 (React 19), Tailwind CSS 4, PostgreSQL, TypeScript 6  
**Domain:** https://codevertexafrica.com  
**Namespace:** `codevertex-website` (K8s: `codevertex`)

---

## Strategic Goals

1. **Brand presence** — Position Codevertex as East Africa's premier digital transformation partner
2. **Digitika lead generation** — Drive course enrollments with frictionless online payment (M-Pesa, Paystack)
3. **Corporate pipeline** — Capture B2B inquiries for Power Suite and custom development
4. **AI-powered engagement** — Vera chatbot for 24/7 lead qualification and course guidance
5. **Performance & SEO** — Fast, indexed, mobile-first for Kenyan market

---

## Sprint Summary

Each row matches a file in `docs/sprints/`.

| Sprint | Theme | Status |
|--------|-------|--------|
| Sprint 1 | Foundation: Next.js 16, layout, brand system | Done |
| Sprint 2 | Digitika Academy: course catalog and enrollment | Done |
| Sprint 3 | Content pages and home sections | Done |
| Sprint 4 | Vera AI chatbot and lead capture | Done |
| Sprint 5 | Homepage redesign and Code-Starter integration | Superseded by sprint 9 |
| Sprint 6 | DevOps, K8s deployment and CI/CD | In progress |
| Sprint 7 | Kids and Teens relaunch, admin and website sync, parent portal | Done |
| Sprint 8 | Custom payment plans, student and parent accounts, manual deposits | Done |
| Sprint 9 | Website redesign, real imagery and the enquiry notices | Done, open items listed |
| Next | SEO, performance and PWA; blog CMS; corporate portal | Planned |

---

## Technical Architecture

### Frontend
- **Framework:** Next.js 16.2 (App Router, Turbopack)
- **React:** 19.2.5 (Server Components default)
- **CSS:** Tailwind CSS 4 + shadcn/ui
- **Animations:** Framer Motion
- **Forms:** React Hook Form + Zod
- **State:** Zustand + TanStack Query

### Backend (Next.js API Routes)
- `POST /api/contact` — Contact form → PostgreSQL
- `POST /api/enrollments` — Digitika enrollment → PostgreSQL + Treasury redirect
- `POST /api/leads` — Chatbot lead capture → PostgreSQL
- `POST /api/chat` — Vera AI proxy → Claude Haiku 4.5

### Database
- **Engine:** PostgreSQL 17
- **ORM:** Raw `pg` (migrate to Prisma in Sprint 8)
- **Tables:** `contact_submissions`, `enrollments`, `leads`

### Payments
- **Gateway:** Codevertex Treasury (books.codevertexafrica.com)
- **Methods:** M-Pesa, Paystack
- **Pattern:** Redirect to treasury pay page with amount + tenant params

---

## Folder Structure

```
codevertex-website/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Home
│   │   ├── digitika/           # Academy catalog
│   │   ├── services/           # Power Suite details
│   │   ├── about/              # Company profile
│   │   ├── blog/               # Blog listing
│   │   ├── pricing/            # Service pricing
│   │   ├── contact/            # Contact form
│   │   └── api/                # Route handlers
│   ├── components/
│   │   ├── home/               # Home page sections
│   │   ├── digitika/           # Academy components
│   │   ├── layout/             # Navbar, Footer
│   │   ├── chat/               # Vera AI chatbot
│   │   ├── providers/          # Theme, Query providers
│   │   └── ui/                 # shadcn primitives
│   ├── config/
│   │   ├── courses.ts          # Course catalog data
│   │   └── services.ts         # Power Suite data
│   └── lib/
│       ├── constants.ts        # URLs, site config
│       ├── db.ts               # PostgreSQL client
│       └── utils.ts            # Helpers
├── public/
│   ├── images/                 # Optimised assets
│   └── brochures/              # Downloadable PDFs
├── docs/
│   ├── sprints/                # Sprint documentation
│   ├── architecture.md         # System design
│   └── integrations.md         # External service patterns
├── scripts/
│   └── schema.sql              # DB schema (DDL)
└── Dockerfile                  # Production container
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Claude API key for Vera chatbot |
| `NEXT_PUBLIC_TREASURY_TENANT` | Treasury tenant slug (`codevertex`) |
| `NEXT_PUBLIC_TREASURY_PAY_URL` | Treasury pay URL |
| `NEXT_PUBLIC_SSO_URL` | SSO login URL |
| `INTERNAL_SERVICE_KEY` | S2S auth key (if treasury API called server-side) |

---

## Key Decisions

- **No shared-ui-lib** for initial payment flow — direct treasury redirect is simpler for a marketing site
- **PostgreSQL raw client** — `pg` preferred over Prisma for minimal dependencies; migrate in Sprint 8
- **Standalone output** — `next build` with `output: 'standalone'` for minimal Docker image
- **Image hosting** — all images served from `/public/images/`; external images via Next.js remotePatterns
- **Auth** — no login wall on marketing site; SSO link goes to `accounts.codevertexafrica.com`
