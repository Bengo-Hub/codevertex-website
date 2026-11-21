# Database maintenance

The production database runbook for the website (seeding, resets, Prisma migrations against the
cluster) names cluster namespaces, the database admin role and pod names, so it lives in the
private operations docs: `codevertex-private-docs`
`shared-docs-internal/operations/service-runbooks/codevertex-website-database-maintenance.md`, next
to the platform-wide `shared-docs-internal/operations/database-maintenance.md`.

Course content lives in the database only, and the seed is non-destructive. For local development,
point `DATABASE_URL` and `DIRECT_DATABASE_URL` at your own PostgreSQL and run the Prisma commands
from `package.json`.
