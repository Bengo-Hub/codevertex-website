# Database Maintenance — Codevertex Website

The codevertex-website uses **PostgreSQL** via **Prisma ORM** (not Ent/Atlas). Schema changes are applied with `prisma db push` and seeding runs automatically at container startup via `scripts/entrypoint.sh`.

## Service Database Info

| Field | Value |
|-------|-------|
| **Namespace** | `codevertex` |
| **Database** | `codevertex` |
| **DB User** | `codevertex_user` |
| **Deployment** | `codevertex-website` |
| **PostgreSQL Pod** | `postgresql-0` (namespace: `infra`) |
| **Admin User** | `admin_user` |
| **Migration tool** | Prisma 7 (`prisma db push` + `prisma migrate`) |
| **Schema file** | `prisma/schema.prisma` |
| **Migrations dir** | `prisma/migrations/` |
| **Seed entry** | `prisma/seed.ts` |

---

## Startup Behaviour

`scripts/entrypoint.sh` runs on every container start:

1. `prisma db push --url $DIRECT_DATABASE_URL --accept-data-loss` — syncs schema (uses direct Postgres URL, not PgBouncer)
2. `tsx /app/prisma/seed.ts` - idempotent, non-destructive seed (see "Seed rules" below)
3. `node server.js` — starts the Next.js server

> **Important:** `DIRECT_DATABASE_URL` (direct postgres) must be used for schema operations. `DATABASE_URL` uses PgBouncer (`?pgbouncer=true`) and is for runtime queries only.

---

## Full DB Reset (Clean Slate)

Use when: schema is corrupt, migrations are broken, or you need a fresh seed.

```bash
# 1. Scale down the deployment
kubectl scale deployment codevertex-website -n codevertex --replicas=0

# 2. Terminate any active sessions
kubectl exec postgresql-0 -n infra -- sh -c "export PGPASSWORD='Vertex2020!'; \
  psql -h 127.0.0.1 -U admin_user -d postgres -c \
  \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='codevertex' AND pid<>pg_backend_pid();\""

# 3. Drop and recreate the database
kubectl exec postgresql-0 -n infra -- sh -c "export PGPASSWORD='Vertex2020!'; \
  dropdb -h 127.0.0.1 -U admin_user codevertex --if-exists; \
  createdb -h 127.0.0.1 -U admin_user codevertex"

# 4. Fix ownership and privileges
kubectl exec postgresql-0 -n infra -- sh -c "export PGPASSWORD='Vertex2020!'; \
  psql -h 127.0.0.1 -U admin_user -d postgres -c \
  \"ALTER DATABASE codevertex OWNER TO codevertex_user; \
    GRANT ALL PRIVILEGES ON DATABASE codevertex TO codevertex_user;\""

kubectl exec postgresql-0 -n infra -- sh -c "export PGPASSWORD='Vertex2020!'; \
  psql -h 127.0.0.1 -U admin_user -d codevertex -c \
  \"GRANT ALL ON SCHEMA public TO codevertex_user; \
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO codevertex_user; \
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO codevertex_user;\""

# 5. Scale up — entrypoint auto-runs prisma db push + seed
kubectl scale deployment codevertex-website -n codevertex --replicas=1
kubectl rollout status deployment/codevertex-website -n codevertex --timeout=180s

# 6. Confirm seed ran
kubectl logs deployment/codevertex-website -n codevertex --tail=50
```

---

## Run Seed Only (Without Schema Reset)

If you only need to re-seed without dropping the DB:

```bash
kubectl exec -n codevertex deployment/codevertex-website -- \
  sh -c "DATABASE_URL=\$DIRECT_DATABASE_URL tsx /app/prisma/seed.ts"
```

The seed is **idempotent and non-destructive**, so running it multiple times is safe.

### Seed rules (since the Oct 2026 Kids & Teens relaunch)

The database is the single source of truth for course content; admins edit everything from `/admin/courses`. The seed never resets admin edits:

| Data | Rule |
|------|------|
| Courses | Missing course: created. Existing course: left as is, except (a) missing `metadata` keys are backfilled, and (b) when the seed entry's `seedVersion` is higher than the row's `metadata._seedVersion`, the entry is applied once over the row. |
| Cohorts | Create-only, keyed by (courseId, startDate). Admins own dates, slots and status afterwards. |
| Blog posts | Create-only (`skipDuplicates` on slug). |

Automated checks: `pnpm test` runs the catalog and parent-portal unit tests (also in CI). The seed upgrade, parent code flow and progress queries are covered by `tests/db.integration.test.ts`, which runs only with `TEST_DATABASE_URL` pointing at an empty throwaway database.

To push a deliberate catalog change to production, edit the entry in `prisma/seed/courses.ts` **and** bump its `seedVersion`.

The seed must stay self-contained: the runtime image ships only `prisma/` plus `src/lib/digitika-rbac-catalog.ts` (copied explicitly in the `Dockerfile`). Do not import other `src/` files from the seed.

---

## Schema Changes (Local Development)

When modifying `prisma/schema.prisma`:

```bash
# Push schema changes to local DB
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/codevertex?sslmode=disable" \
  pnpm exec prisma db push

# Or generate a versioned migration (preferred for tracked changes)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/codevertex?sslmode=disable" \
  pnpm exec prisma migrate dev --name <migration_name>

# Generate Prisma client after schema changes
pnpm exec prisma generate

# Run seed locally
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/codevertex?sslmode=disable" \
  pnpm exec prisma db seed
```

> **Local DB:** PostgreSQL 17 at `C:/Program Files/PostgreSQL/17/` — use same database name `codevertex` as production.

---

## Seed Data Overview

| Seeder | File | Content |
|--------|------|---------|
| Courses | `prisma/seed/courses.ts` | Initial course catalog: fields, installment plans and page `metadata` (curriculum, testimonials, schedule, age range...). Self-contained. |
| Cohorts | `prisma/seed/cohorts.ts` | Scheduled cohort intake dates |
| Blog posts | `prisma/seed/blog.ts` | Starter blog articles |

---

## Verify DB State

```bash
# Check table row counts
kubectl exec postgresql-0 -n infra -- sh -c "export PGPASSWORD='Vertex2020!'; \
  psql -h 127.0.0.1 -U admin_user -d codevertex -c \
  \"SELECT 'courses' AS t, count(*) FROM courses \
  UNION ALL SELECT 'cohorts', count(*) FROM cohorts \
  UNION ALL SELECT 'blog_posts', count(*) FROM blog_posts \
  UNION ALL SELECT 'contact_submissions', count(*) FROM contact_submissions \
  UNION ALL SELECT 'leads', count(*) FROM leads \
  UNION ALL SELECT 'enrollments', count(*) FROM enrollments;\""

# Check DB size
kubectl exec postgresql-0 -n infra -- sh -c "export PGPASSWORD='Vertex2020!'; \
  psql -h 127.0.0.1 -U admin_user -d postgres -c \
  \"SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database WHERE datname='codevertex';\""
```

---

## Troubleshooting

### Seed fails: `Cannot find module '../../src/config/courses'`

The container image is missing `src/config/`. This is fixed in the Dockerfile (runner stage copies `src/config`). If running an older image, rebuild and redeploy.

### Pod CrashLoopBackOff after reset

```bash
kubectl logs deployment/codevertex-website -n codevertex --previous --tail=50
```

Common causes:
- `DIRECT_DATABASE_URL` not set or wrong — check `codevertex-website-secrets`
- Prisma migration conflict — run a full DB reset

### `ERROR: permission denied for schema public`

Re-run the ownership fix commands from step 4 of the full reset procedure above.

### PgBouncer sessions blocking dropdb

Even after scaling down, PgBouncer may hold idle connections. Terminate them first (step 2) before dropping.
