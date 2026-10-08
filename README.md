# Codevertex Website — Next.js 16.2

Full-featured marketing website for Codevertex Africa Limited built with the **latest stable** versions of everything.

## Stack

| Package | Version | Notes |
|---------|---------|-------|
| **Next.js** | `^16.2.4` | App Router, Turbopack default, React Compiler stable |
| **React** | `^19.2.5` | Latest stable — `ref` as prop, `use()`, Actions, View Transitions |
| **React DOM** | `^19.2.5` | |
| **Tailwind CSS** | `^4.2.4` | CSS tokens matching accounts/auth-ui exactly |
| **Framer Motion** | `^12.9.4` | Latest — View Transitions compatible |
| **Lucide React** | `^1.14.0` | Latest icon set |
| **React Hook Form** | `^7.56.4` | |
| **Zod** | `^4.4.2` | Schema validation |
| **Sonner** | `^2.3.4` | Toast notifications |
| **next-themes** | `^0.4.6` | Dark/light mode |
| **Prisma** | `^7.8.0` | ORM and schema (`prisma/schema.prisma`) on PostgreSQL |
| **tailwind-merge** | `^3.3.0` | |

## Next.js 16.2 Key Changes Applied

- ✅ **Turbopack default** — `dev`/`build` use Turbopack automatically. No `--turbopack` flag needed
- ✅ **`next lint` removed** — replaced with `typecheck` script using `tsc --noEmit`
- ✅ **`serverExternalPackages`** — replaces old `serverComponentsExternalPackages`  
- ✅ **`reactCompiler`** option promoted to stable top-level config (disabled by default)
- ✅ **Adapters API stable** — `adapterPath` promoted to top-level in 16.2
- ✅ **`cacheLife`/`cacheTag` stable** — no `unstable_` prefix required
- ✅ **ESLint** — `eslint-config-next` 16.2.4 is installed; `pnpm lint` needs an `eslint.config.mjs` (flat config) before it runs
- ✅ **`--turbopack` flag removed** from scripts (it's the default now)

## React 19.2 Key Changes Applied

- ✅ **`ref` as a regular prop** — no `forwardRef` needed anywhere
- ✅ **`resolvedTheme`** used in ThemeToggle (more reliable than `theme`)
- ✅ **React Compiler ready** — enable in `next.config.ts` when needed
- ✅ **`Activity`**, `useEffectEvent`, View Transitions available for future use

## Theme

Pixel-matched to `auth-service/auth-ui` (your SSO/accounts site):

| Mode | Background | Primary |
|------|-----------|---------|
| **Light** | Creamy white `hsl(48 100% 96%)` | Hot pink `hsl(330 81% 60%)` |
| **Dark** | Deep navy `hsl(222.2 84% 4.9%)` | Sky blue `hsl(199 89% 48%)` |

Theme switcher is in the navbar (Sun/Moon icon).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — hero, services grid, power suite tabs, Digitika teaser, trust, CTA |
| `/services` | Full Power Suite + all microservice cards |
| `/digitika` | Course catalog (20+ courses) + enrollment modal + Treasury payment |
| `/about` | Vision, mission, track record, partners |
| `/contact` | Contact form → saved to DB |
| `/pricing` | 3-tier pricing |
| `/blog` | Blog post grid |
| `/careers` | Job listings |

## API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/contact` | Saves contact form to `contact_submissions` table |
| `POST /api/enrollments` | Saves Digitika enrollment before payment redirect |
| `POST /api/leads` | Saves chatbot lead capture to `leads` table |
| `POST /api/chat` | Vera AI chatbot — proxies to Claude Haiku 4.5 |

## Database

PostgreSQL through Prisma. The schema is defined in `prisma/schema.prisma` (contact submissions, leads, enrollments, courses, cohorts, blog posts and more). `scripts/schema.sql` is a legacy raw-SQL copy and is not the source of truth.

```bash
pnpm exec prisma generate
pnpm exec prisma db push
```

## Getting Started

```bash
# 1. Install dependencies
pnpm install
# This project uses pnpm only (see packageManager in package.json)

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — see .env.example for the full list and comments. At minimum:
#   DATABASE_URL=postgresql://...
#   ANTHROPIC_API_KEY=sk-ant-...
#   NEXT_PUBLIC_TREASURY_TENANT=your-uuid
# To log in locally (rather than against production SSO), also run auth-service locally,
# seed it (`cd ../auth-service/auth-api && go run ./cmd/seed`), and set
# NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:4000

# 3. Create the database tables
pnpm exec prisma generate
pnpm exec prisma db push

# 4. Start dev server (Turbopack is automatic in Next.js 16)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Payment Flow (Digitika)

Follows the Codevertex treasury invoice-first pattern:

1. User fills enrollment form → `POST /api/enrollments` saves record with `payment_status: pending`
2. Browser opens `https://books.codevertexafrica.com/pay?amount=...&tenant=...&gateways=paystack,mpesa`
3. User pays via Paystack or M-Pesa on the shared treasury pay page
4. Treasury webhook updates `payment_status` to `succeeded`

## Deployment

Production runs as a Docker image (`Dockerfile`, `output: 'standalone'`) built and deployed by `.github/workflows/deploy.yml` on every push to `main`. The container entrypoint (`scripts/entrypoint.sh`) syncs the database schema and seeds data on start.

To run a production build locally:

```bash
pnpm build
pnpm start
```
