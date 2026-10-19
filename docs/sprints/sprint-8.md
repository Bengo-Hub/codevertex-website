# Sprint 8: custom payment plans, student and parent accounts, manual deposits

**Status:** Done (Oct 2026)

## Delivered
- [x] Custom payment plans: per-course rules in `Course.metadata.installmentPolicy` (minimum deposit as a share and an amount, most payments, smallest payment, spacing, latest final date), set on the course editor's Pricing tab with a live preview. Checkout offers "Build your own plan" (deposit plus number of payments, live schedule).
- [x] `src/lib/installments.ts` is the one schedule builder (checkout modal, `POST /api/enrollments`, admin enrollments). The enrollment API no longer trusts browser amounts or dates; discounted preset plans add up exactly.
- [x] Student SSO accounts (role `student`) once an enrollment is confirmed, with a temporary password by email (`digitika/portal_account`) and a forced change at first sign-in.
- [x] Learners under 18 must name a parent or guardian, who gets a `parent` account. The parent portal (`/digitika/parent`) accepts that account (pick a child) as well as the Student ID and one-time code.
- [x] Admins record bank deposits, cash, cheques and direct M-Pesa ("Record payment" on Enrollments and Installments). Booked in treasury first, then applied as the next installment with the balance re-spread over the rest.
- [x] One payment allocator (`src/lib/enrollment-payments.ts`) for treasury events and manual deposits. Fixed: an underpayment marked the installment paid and lost the shortfall; a payment clearing the balance marked leftover installments paid at full value.
- [x] Removed `POST /api/enrollments/{id}/sync` (marked installments paid without treasury).
- [x] Student emails stored lowercased and matched in any case.
- [x] `docs/database-maintenance.md` no longer carries the Postgres admin password.
- [x] Tests: `tests/installments.test.ts` (schedules, rules, summaries) and allocator cases in `tests/db.integration.test.ts`; the integration harness now runs on Windows too.

- [x] Payment status can no longer be typed in: the admin PATCH refuses `succeeded`/`refunded` and any change once money is received; "Payment already collected" on enroll books treasury (method and reference required) through the same path.

- [x] 2026-10-18: admin New Enrollment form matches public checkout (date of birth, course age limits, parent or guardian details, already-enrolled courses, existing student by email, country phone check) and is wider with two columns. Age, guardian and phone rules moved to `src/lib/learner-rules.ts` and `src/lib/phone-countries.ts`, shared by both modals and both routes (the public route now enforces the course age limit server side too). Tests: `tests/learner-rules.test.ts`.

- [x] 2026-10-18: admin pages that only listed records now have actions. Students: add, edit (details and guardian, copied onto their enrollments), view courses and certificates, enroll in a course, delete (only with no enrollments). Enrollments: details with the installment schedule, edit the student, delete (only while no money is received). Leads: add, edit with notes (re-scored), delete, WhatsApp and email shortcuts. Contacts: reply by email or WhatsApp, delete. New routes: `POST /api/admin/students`, `GET|PATCH|DELETE /api/admin/students/{id}`, `POST /api/admin/leads`, `DELETE /api/admin/contacts/{id}`, `DELETE /api/admin/enrollments/{id}`; shared dialog shell `AdminModal`. Certificates (view, revoke), Installments (record, remind) and Permissions (read only catalog) already had their actions.

- [x] 2026-10-19: every Digitika notice goes through notifications-api's digitika consumer as an event (enrollment confirmed, receipt, installment reminder, portal account, parent access code, contact acknowledgement, certificate issued) to the learner and any guardian on email and WhatsApp; `src/lib/notifications.ts` and its HTTP/SMS fallbacks are removed. Installment reminders had never reached a part-paid enrollment (the old check skipped any enrollment whose status was `succeeded`, true after the first payment); they now follow the installment row, daily before the due date and every 3 days once overdue, in batches. The parent portal code goes to the guardian by email and WhatsApp (it was sent by SMS, which reaches no one). Tests: `tests/notice-contacts.test.ts`.

## Follow-ups
- Rotate the Postgres admin password: it was in this repo's history.
