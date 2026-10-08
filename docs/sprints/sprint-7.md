# Sprint 7 - Kids & Teens Relaunch, Admin/Website Sync, Parent Portal

**Status:** Done (Oct 2026)

## Delivered
- [x] Merged PR #3 (projects gallery, careers attachment page, SEO/security headers); restored `.env.example` files it deleted
- [x] New `kids` category "Digitika Kids & Teens": Tech Explorers (6-10, KES 8,000), Young Innovators: Game Development & Python (10-16, KES 15,000, renamed from Game Development for Kids), new Young Innovators: Robotics, IoT & AI (10-16, KES 15,000), with 8-week curricula and Nov 2026 / Jan 2027 cohorts
- [x] DB is the single source of truth for course pages (`Course.metadata`); static per-course config removed; course page no longer 404s for admin-created courses
- [x] Admin course editor covers every page section, supports creating courses and importing the curriculum from LMS modules; shared Zod schema for create/update
- [x] Seed made non-destructive (versioned course revisions, metadata backfill, create-only cohorts and blog) and self-contained (production image only ships `prisma/`)
- [x] Parent portal `/digitika/parent` (Student ID + one-time code): progress, results, announcements, balances, pay arrears
- [x] Closed public enrollment summary enumeration (requires full receipt reference)
- [x] Admin stats rewritten as SQL aggregates: revenue now includes upfront payments, overdue counts unpaid past-due rows, upcoming excludes past-due, trend computed server-side; new indexes on enrollments.created_at and installment_schedules (status, due_date), paid_at
- [x] Student IDs now generated with a CSPRNG (`crypto.randomInt`)
- [x] Removed unused `/api/student/dashboard` (duplicate of `/api/students/me`); trimmed `/api/students/me` columns

- [x] Automated tests: `pnpm test` (19 tests: catalog integrity, admin schema, token scoping, rate-limit IP handling, payment maths; DB integration tests for seed upgrades, parent code flow and progress, opt-in via `TEST_DATABASE_URL`), run in CI

## Follow-ups
- `/api/students/[studentId]/*` content routes still trust the Student ID alone (pre-existing, see `src/lib/digitika-access.ts`); move them behind SSO or the parent-style one-time code
