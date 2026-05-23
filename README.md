# Codevertex Website — Next.js 16.2

Full-featured marketing website for Codevertex Africa Limited built with the **latest stable** versions of everything.

## Stack

| Package | Version | Notes |
|---------|---------|-------|
| **Next.js** | `^16.2.4` | App Router, Turbopack default, React Compiler stable |
| **React** | `^19.2.5` | Latest stable — `ref` as prop, `use()`, Actions, View Transitions |
| **React DOM** | `^19.2.5` | |
| **Tailwind CSS** | `^3.4.17` | CSS tokens matching accounts/auth-ui exactly |
| **Framer Motion** | `^12.9.4` | Latest — View Transitions compatible |
| **Lucide React** | `^0.511.0` | Latest icon set |
| **React Hook Form** | `^7.56.4` | |
| **Zod** | `^3.24.4` | Schema validation |
| **Sonner** | `^2.3.4` | Toast notifications |
| **next-themes** | `^0.4.6` | Dark/light mode |
| **pg** | `^8.14.1` | PostgreSQL driver |
| **tailwind-merge** | `^3.3.0` | |

## Next.js 16.2 Key Changes Applied

- ✅ **Turbopack default** — `dev`/`build` use Turbopack automatically. No `--turbopack` flag needed
- ✅ **`next lint` removed** — replaced with `typecheck` script using `tsc --noEmit`
- ✅ **`serverExternalPackages`** — replaces old `serverComponentsExternalPackages`  
- ✅ **`reactCompiler`** option promoted to stable top-level config (disabled by default)
- ✅ **Adapters API stable** — `adapterPath` promoted to top-level in 16.2
- ✅ **`cacheLife`/`cacheTag` stable** — no `unstable_` prefix required
- ✅ **No `eslint-config-next`** — Next.js 16 removed built-in ESLint integration
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

PostgreSQL with 3 tables:
- `contact_submissions` — contact form entries
- `enrollments` — Digitika course enrollments (pending payment)
- `leads` — chatbot lead captures

```bash
# Create tables
psql $DATABASE_URL -f scripts/schema.sql
```

## Getting Started

```bash
# 1. Install dependencies
pnpm install
# or: npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local:
#   DATABASE_URL=postgresql://...
#   ANTHROPIC_API_KEY=sk-ant-...
#   NEXT_PUBLIC_TREASURY_TENANT=your-uuid

# 3. Run DB migrations
psql $DATABASE_URL -f scripts/schema.sql

# 4. Start dev server (Turbopack is automatic in Next.js 16)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Upgrade from Next.js 15

If you had a Next.js 15 project:

```bash
# Automated codemods
npx @next/codemod@canary upgrade latest

# Or manually:
npm install next@latest react@latest react-dom@latest
```

Key breaking changes to be aware of:
1. Remove `--turbopack` from dev script (it's the default now)
2. Remove `eslint-config-next` dependency
3. Replace `serverComponentsExternalPackages` with `serverExternalPackages`
4. Remove `experimental.ppr` flag
5. `next lint` command no longer exists — use ESLint directly

## Payment Flow (Digitika)

Follows the Codevertex treasury invoice-first pattern:

1. User fills enrollment form → `POST /api/enrollments` saves record with `payment_status: pending`
2. Browser opens `https://books.codevertexitsolutions.com/pay?amount=...&tenant=...&gateways=paystack,mpesa`
3. User pays via Paystack or M-Pesa on the shared treasury pay page
4. Treasury webhook updates `payment_status` to `succeeded`

## Deployment

```bash
pnpm build
pnpm start
```

Deploy to **Vercel** (recommended):
1. Push to GitHub
2. Import repo in Vercel dashboard
3. Set env vars: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_TREASURY_TENANT`
4. Deploy — Vercel auto-detects Next.js 16

Place the project in your monorepo at:
```
D:\Projects\Codevertex\codevertex-website\
```
