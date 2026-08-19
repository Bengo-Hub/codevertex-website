// "Roadmap Reality Check" — a section-by-section fact-check of an intern's platform
// gap-analysis against the real Codevertex codebase, compiled 2026-08-19. Every finding
// below is tied to a concrete file or endpoint found during a direct audit, not an assumption.

export type FindingStatus = 'missing' | 'partial' | 'ok' | 'outrepo' | 'bizdep' | 'urgent';

export const STATUS_LABEL: Record<FindingStatus, string> = {
  missing: 'Confirmed gap',
  partial: 'Partially built / nuanced',
  ok: 'Already built elsewhere',
  outrepo: 'Owned by another service',
  bizdep: 'Depends on a partner decision',
  urgent: 'Live exposure — fix now',
};

export interface Finding {
  num: string;
  priority: 'P0' | 'P1' | 'P2';
  title: string;
  why: string;
  entries: { status: FindingStatus; body: string[] }[];
}

export interface AuditSection {
  id: string;
  number: string;
  title: string;
  note: string;
  findings: Finding[];
}

export const URGENT_CALLOUT = {
  title: "This isn't a roadmap item — it's live right now",
  body: [
    "**9 of the site's ~14 `/api/admin/*` routes have zero auth check**: `enrollments`, `cohorts`, `contacts`, `courses`, `discounts`, `installments`, `leads`, `stats`, `students`, plus their `[id]` variants. `middleware.ts` explicitly excludes `/api` from its matcher, so there's no fallback protection — student PII, payment/installment data, and discount codes are readable (and in places writable) by anyone who hits the endpoint directly, no login required.",
    'Bonus find: `api/webhooks/treasury/route.ts` never verifies the `X-Treasury-Signature` header despite its own docs saying it should — a forged payload could currently mark installments as paid.',
    'Recommend fixing this immediately, independent of how the rest of the roadmap below gets sequenced. The pattern to extend already exists: 5 of the ~14 routes correctly use `requirePermission`/`requireDigitikaAdmin` from `src/lib/auth/rbac.ts` — it\'s a matter of applying the same guard to the other 9.',
  ],
};

export const OVERVIEW_STATS = [
  { n: '1', label: 'live security exposure', tone: 'urgent' as const },
  { n: '23', label: 'confirmed real gaps', tone: 'default' as const },
  { n: '7', label: 'more nuanced than stated', tone: 'partial' as const },
  { n: '4', label: 'already built — just need wiring', tone: 'ok' as const },
  { n: '2', label: 'belong to a different service', tone: 'outrepo' as const },
];

export const SHIPPED_TODAY = [
  {
    tag: 'auth-ui · docs hub',
    title: 'Notifications & Subscriptions API docs',
    body: 'Added real developer-docs pages for notifications-api and subscriptions-api to the existing /docs hub, flipped Notifications from "coming soon" to live, and removed the inventory-api/library-api placeholders — both are internal-only services, not public developer products.',
  },
  {
    tag: 'codevertex-website',
    title: 'SMS installment reminders',
    body: "Wired the existing Africa's Talking SMS channel into the installment-reminder flow, alongside the existing email send — closing the doc's own P0 item 1.8 as a real fix, not just documentation.",
  },
  {
    tag: 'shared-ui-lib',
    title: 'Careers portal, extracted for reuse',
    body: "Pulled erp-ui's public careers-portal (postings list, detail, apply form) into shared-ui-lib as a new module, so both erp-ui and this website's own /careers page consume the same code instead of maintaining two copies.",
  },
];

export const AUDIT_SECTIONS: AuditSection[] = [
  {
    id: 's1',
    number: '01',
    title: 'Digitika Academy (LMS)',
    note: 'Correct as the highest-leverage area — but the real state is more textured than "checkout page, no LMS."',
    findings: [
      {
        num: '1.1', priority: 'P0', title: 'Course content delivery', why: 'Video lessons, quizzes, downloadable resources.',
        entries: [{ status: 'missing', body: [
          'No `Lesson`/`Quiz`/`VideoContent` model anywhere in `prisma/schema.prisma`. `CourseDetailClient.tsx` only has marketing copy about assessments. The only real downloadable assets are 3 marketing brochures, not per-lesson resources.',
        ] }],
      },
      {
        num: '1.2', priority: 'P0', title: 'Progress tracking & completion %', why: 'Per student, per course.',
        entries: [{ status: 'missing', body: [
          'No progress fields exist on any model, no UI for it anywhere. Depends on item 1.1 shipping first — there\'s no content to track progress against yet.',
        ] }],
      },
      {
        num: '1.3', priority: 'P0', title: 'Auto-generated, verifiable certificates', why: 'Core value prop of "ICDL/CCNA certification."',
        entries: [{ status: 'partial', body: [
          '**For Digitika-run bootcamps** (e.g. Code-Starter): genuinely missing, build as proposed — no `Certificate` model, only a static, non-verifiable sample PDF.',
          "**For ICDL / Cisco CCNA tracks**: Codevertex doesn't administer these exams — ICDL Foundation and Cisco Networking Academy issue those credentials directly. Nothing in the schema distinguishes an internal cert from a partner one (no `certIssuer`/`externalCertId` field on `Course` or `Enrollment`). The real gap there is a verification-tracking layer (admin-entered external cert ID + link), not a PDF generator — don't build one system for both.",
        ] }],
      },
      {
        num: '1.4', priority: 'P1', title: 'Cohort/live-class scheduling', why: 'Expose /admin/cohorts to students.',
        entries: [{ status: 'partial', body: [
          'A real `Cohort` model + admin CRUD + a public `/api/courses/[id]/cohorts` endpoint already exist and are consumed by `EnrollmentModal.tsx` for intake-batch selection. The genuine remaining gap is session/attendance tracking for already-enrolled students — not scheduling infrastructure. (Note: the admin cohorts route is also one of the 9 unguarded endpoints above.)',
        ] }],
      },
      {
        num: '1.5', priority: 'P1', title: 'Discussion forum / Q&A', why: 'Retention, reduces support load.',
        entries: [{ status: 'missing', body: ['Zero references anywhere in the codebase.'] }],
      },
      {
        num: '1.6', priority: 'P1', title: 'Instructor dashboard', why: 'Grade submissions, post announcements.',
        entries: [{ status: 'missing', body: [
          '"Instructor" appears only as marketing copy. The Digitika RBAC module catalog has no instructor role at all — only dashboard/enrollments/students/leads/courses/cohorts/installments/discounts/users/roles.',
        ] }],
      },
      {
        num: '1.7', priority: 'P1', title: 'Low-bandwidth mobile video player', why: 'Adaptive bitrate, offline-downloadable.',
        entries: [{ status: 'missing', body: [
          "There's no video content module to play yet (item 1.1). Sequence this after content delivery ships, not before.",
        ] }],
      },
      {
        num: '1.8', priority: 'P0', title: 'Installment reminders via SMS', why: 'M-Pesa users miss email; SMS cuts defaults.',
        entries: [{ status: 'ok', body: [
          "notifications-api already has a real, live Africa's Talking SMS integration. The only gap was one call site in `src/lib/notifications.ts` hardcoding `channel: 'email'`. Wired up as part of today's platform-integration work — see \"What shipped today\" below.",
        ] }],
      },
      {
        num: '1.9', priority: 'P2', title: 'Referral program', why: 'Cheap growth channel.',
        entries: [{ status: 'missing', body: [
          '"Referral" exists only as a dropdown option string on the enrollment form — no codes, tracking, or incentive logic. The existing generic `DiscountRule` model could plausibly be extended rather than building a parallel system.',
        ] }],
      },
      {
        num: '1.10', priority: 'P2', title: 'Alumni / job placement board', why: 'Turn "200+ trained" into a recruiting pipeline.',
        entries: [
          { status: 'ok', body: [
            "erp-api already runs a full, live careers-portal (public job postings + applications API), and Codevertex is itself a tenant on its own platform. The website's own /careers page was actually just as hardcoded as pricing — being wired to the real API today (see \"What shipped\").",
          ] },
          { status: 'bizdep', body: [
            'No evidence any of these named partners (Danka Africa, Maseno, KCA) are actual erp-api tenants — every mention of them found in the codebase is marketing copy, not tenant data. Pulling in their jobs needs those orgs to actually be onboarded first; this half isn\'t an engineering task until that\'s true.',
          ] },
        ],
      },
    ],
  },
  {
    id: 's2',
    number: '02',
    title: 'AI / Vera Chatbot',
    note: "Chat isn't implemented in this repo at all — it's fully delegated to a separate microservice. Several items here are misfiled against the wrong repo, not actually missing from the platform.",
    findings: [
      {
        num: '2.1', priority: 'P0', title: 'Rate limiting on /api/chat', why: 'Unmetered public Claude proxy.',
        entries: [{ status: 'outrepo', body: [
          'There is no `/api/chat` route in codevertex-website — the widget script loads from `marketflow.codevertexafrica.com` and talks to a separate marketflow-ai backend. Rate limiting belongs there. `shared-ratelimit` is already fleet-standard (e.g. erp-api\'s public careers endpoint runs it at 10 requests/hour/IP) — trivial to apply on marketflow-ai\'s side if it isn\'t already.',
        ] }],
      },
      {
        num: '2.2', priority: 'P0', title: 'RAG over course catalog + docs', why: "Stop Vera hallucinating course details.",
        entries: [{ status: 'outrepo', body: [
          'Same story — any retrieval logic would live in marketflow-ai, not this repo. Not evaluated this pass; needs its own audit of that service.',
        ] }],
      },
      {
        num: '2.3', priority: 'P1', title: 'Lead qualification scoring', why: 'Hot/warm/cold tagging into /admin/leads.',
        entries: [{ status: 'missing', body: [
          'The `Lead` model has only a `status` field, no score. May exist partially in marketflow\'s own CRM logic — not verified this pass.',
        ] }],
      },
      {
        num: '2.4', priority: 'P1', title: 'WhatsApp channel for Vera', why: 'Bigger reach than the web widget.',
        entries: [{ status: 'partial', body: [
          "Today it's just a static wa.me click-to-chat link. Separately, notifications-api already has a real WhatsApp Business channel (templated delivery, not conversational) — useful adjacent infrastructure marketflow-ai could potentially reuse, but templated notifications and a live conversational bot are different problems.",
        ] }],
      },
      {
        num: '2.5', priority: 'P2', title: 'Voice / Swahili + Sheng support', why: 'Genuine local differentiator.',
        entries: [{ status: 'missing', body: [
          'Real new LLM/prompt engineering work, and it lives in marketflow-ai, not here.',
        ] }],
      },
    ],
  },
  {
    id: 's3',
    number: '03',
    title: 'Trust, Security & Compliance',
    note: 'The most important finding of this whole audit is here — see the callout above. The rest ranges from genuinely missing to already-solved-at-the-platform-level.',
    findings: [
      {
        num: '3.1', priority: 'P0', title: 'Server-side auth on all /api/admin/* routes', why: 'Confirmed missing in enrollments/route.ts.',
        entries: [{ status: 'urgent', body: [
          'Worse than one route — see the callout at the top of this page. Fix immediately, independent of roadmap sequencing.',
        ] }],
      },
      {
        num: '3.2', priority: 'P1', title: 'Audit log for admin actions', why: 'Required once multiple admins operate the Power Suite.',
        entries: [{ status: 'partial', body: [
          '**auth-api**: real, full audit log — both writes and reads, already live. **finance-service (treasury-api)**: the `AuditLog` schema and read endpoints (tenant + platform scope) are built and wired, but zero write call-sites were found — the read API exists, nothing populates it yet. Check per-service before assuming "done" anywhere in the Power Suite.',
        ] }],
      },
      {
        num: '3.3', priority: 'P0', title: 'GDPR / Kenya Data Protection Act page + cookie consent', why: 'Marketed as "GDPR-aware" with no implementation found.',
        entries: [{ status: 'missing', body: [
          "No cookie consent banner exists anywhere. The privacy-policy page covers GDPR-style rights but never names Kenya's Data Protection Act 2019 or the ODPC specifically.",
        ] }],
      },
      {
        num: '3.4', priority: 'P1', title: '2FA for the admin panel', why: 'Next layer once server auth is fixed.',
        entries: [{ status: 'ok', body: [
          "auth-api has full TOTP MFA + backup codes + an admin-enforcement toggle, live today. This isn't missing platform-wide — it just needs confirming the enforcement toggle is switched on for codevertex-website's admin accounts. An ops/config check, not new engineering.",
        ] }],
      },
      {
        num: '3.5', priority: 'P2', title: 'Public status page', why: 'Enterprise buyers expect one.',
        entries: [{ status: 'missing', body: ['Not investigated further this pass — genuine new work, low priority.'] }],
      },
      {
        num: '3.6', priority: 'P2', title: 'Security.txt / disclosure page', why: 'Credibility signal for a security-audit seller.',
        entries: [{ status: 'missing', body: ['Trivial to add, low priority relative to the rest of this section.'] }],
      },
    ],
  },
  {
    id: 's4',
    number: '04',
    title: 'Enterprise / Customer-facing',
    note: 'The headline finding here: the "API documentation portal" the doc calls for as new work already exists on a different property.',
    findings: [
      {
        num: '4.1', priority: 'P0', title: 'Case studies with real metrics', why: '"200+ trained" is a claim, not proof.',
        entries: [{ status: 'missing', body: [
          'One fake blog-post stub is tagged "Case Study" — no detail page exists behind it, no real metrics anywhere.',
        ] }],
      },
      {
        num: '4.2', priority: 'P1', title: 'Live demo / sandbox environment', why: 'Reduce sales cycle.',
        entries: [{ status: 'partial', body: [
          "Not built as a public feature yet, but the platform already runs a shared demo tenant used internally for end-to-end testing. That's a plausible foundation for a prospect-facing sandbox rather than building new demo infrastructure from scratch — worth a scoping conversation before treating this as \"build from zero.\"",
        ] }],
      },
      {
        num: '4.3', priority: 'P1', title: 'Self-serve pricing calculator', why: 'Scale sales without staff time.',
        entries: [{ status: 'ok', body: [
          "subscriptions-api already has real, populated, public endpoints (`GET /plans`, `/plans/code/{code}`, `/plans/{id}`) with full industry-specific plan data. The website's own /pricing page is 100% hardcoded and disconnected from it — high value relative to effort, flagged as a natural next step once the subscriptions-api docs page (below) exists.",
        ] }],
      },
      {
        num: '4.4', priority: 'P2', title: 'Client success dashboard', why: 'Stickiness for the "one SSO identity" pitch.',
        entries: [{ status: 'missing', body: ['Genuine new work, low priority relative to the rest of this section.'] }],
      },
      {
        num: '4.5', priority: 'P2', title: 'API documentation portal', why: 'Developers need docs, not just a login.',
        entries: [{ status: 'ok', body: [
          "Doesn't need to be built on codevertex-website at all — a real developer-docs hub already lives on auth-ui (this site's own /integrations page already links out to it). It just needed notifications-api and subscriptions-api pages, and the inventory-api/library-api \"coming soon\" placeholders removed. Done today — see below.",
        ] }],
      },
    ],
  },
  {
    id: 's5',
    number: '05',
    title: 'Technical / Infrastructure',
    note: 'Every item here checked out exactly as reported, with a couple of findings even worse than assumed.',
    findings: [
      {
        num: '5.1', priority: 'P0', title: 'sitemap.xml + robots.txt', why: 'Actively hurting organic SEO.',
        entries: [{ status: 'missing', body: ['Neither file exists, static or generated.'] }],
      },
      {
        num: '5.2', priority: 'P1', title: 'Structured data (JSON-LD)', why: 'Rich results for course listings.',
        entries: [{ status: 'missing', body: ['Zero `application/ld+json` anywhere in the codebase.'] }],
      },
      {
        num: '5.3', priority: 'P0', title: 'Image optimization pass', why: 'Slows LCP on 3G connections.',
        entries: [{ status: 'missing', body: ['11MB across 63 files in `public/images`, exactly as reported.'] }],
      },
      {
        num: '5.4', priority: 'P0', title: 'CI gate: lint + typecheck + test before deploy', why: 'No quality gate before shipping to k8s.',
        entries: [{ status: 'missing', body: [
          'The one workflow file goes straight from checkout to a Docker build (a Trivy vulnerability scan, not a code-quality gate) to deploy — no lint/typecheck/test step at all. `package.json` has no `test` script, and the README\'s claim of a `typecheck` script doesn\'t match reality either — that script doesn\'t exist.',
        ] }],
      },
      {
        num: '5.5', priority: 'P0', title: 'Automated test suite', why: 'Zero test files on payment-adjacent endpoints.',
        entries: [{ status: 'missing', body: ['Exhaustive search for test files/configs (Jest, Vitest, Playwright) found nothing.'] }],
      },
      {
        num: '5.6', priority: 'P1', title: 'Error monitoring', why: 'Confirm instrumentation.ts is actually reporting.',
        entries: [{ status: 'missing', body: [
          '`instrumentation.ts` only starts two NATS event subscribers to keep the local DB in sync with other services — no Sentry or APM of any kind; the package isn\'t even a dependency.',
        ] }],
      },
      {
        num: '5.7', priority: 'P0', title: '.env.local.example committed', why: 'Blocks new contributor onboarding.',
        entries: [{ status: 'missing', body: [
          'Missing at repo root, despite the README explicitly instructing `cp .env.local.example .env.local`. Bonus: the README is stale in two more places — it claims Vercel deployment (actual is Docker + Kubernetes + ArgoCD) and a `typecheck` script that doesn\'t exist. Worth a general "audit the README against reality" pass, not just this roadmap doc.',
        ] }],
      },
    ],
  },
  {
    id: 's6',
    number: '06',
    title: 'Growth / Community',
    note: 'One item here is a much cheaper fix than the original framing suggests.',
    findings: [
      {
        num: '6.1', priority: 'P1', title: 'Public blog with real SEO content', why: 'Content depth determines organic traffic.',
        entries: [{ status: 'partial', body: [
          'A real `BlogPost` Prisma model already exists — the /blog page just never reads from it (hardcoded 6-post array, no `[slug]` detail route). This is "wire up the existing model," not "build a CMS from scratch."',
        ] }],
      },
      {
        num: '6.2', priority: 'P1', title: 'Hackathon / event listing page', why: 'Turn a one-off event into a recurring engine.',
        entries: [{ status: 'missing', body: [
          'Real retrospective content exists (MUCISA Hackathon photos as social proof across several components) but nothing lets a prospect see or register for an upcoming one.',
        ] }],
      },
      {
        num: '6.3', priority: 'P2', title: 'Open-source contribution showcase', why: 'Reinforces the talent-pipeline narrative.',
        entries: [{ status: 'missing', body: ['Not investigated deeply this pass; no evidence found, low priority.'] }],
      },
      {
        num: '6.4', priority: 'P1', title: 'Newsletter signup', why: 'Cheap retention channel, currently absent.',
        entries: [{ status: 'missing', body: ['Zero references anywhere in the codebase.'] }],
      },
    ],
  },
];
