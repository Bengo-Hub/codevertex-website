# Sprint 2 — Digitika Academy

**Theme:** Course catalog, enrollment flow, treasury payment integration  
**Status:** ✅ Complete  
**Duration:** Week 2

---

## Goals

- Build full Digitika Academy course catalog (20+ courses, 5 categories)
- Multi-step enrollment modal with form validation
- Treasury payment redirect (M-Pesa + Paystack)
- Save enrollments to PostgreSQL with `payment_status: pending`
- API route for enrollment persistence

## Deliverables

- [x] `src/config/courses.ts` — 5 categories × 4+ courses each with full metadata
- [x] `DigitikaHero` — dark hero section with stats
- [x] `CourseCatalog` — sticky filter bar + course grid grouped by category
- [x] `CourseCard` — expandable card with mode, duration, price, outcomes, tech stack
- [x] `EnrollmentModal` — 3-step wizard (personal info → review → payment)
- [x] `POST /api/enrollments` — saves to DB, returns 201
- [x] Treasury redirect flow: `books.codevertexafrica.com/pay?amount=...&tenant=...`
- [x] `digitika/page.tsx` — metadata + page composition

## Course Categories

| Category | Courses | Price Range (KES) |
|----------|---------|-------------------|
| ICDL Certification | 4 | 6,500 – 24,000 |
| Cisco CCNA v7 | 4 | 15,000 – 22,000 |
| Artificial Intelligence | 4 | 9,000 – 38,000 |
| Software Engineering | 7 | 8,000 – 45,000 |
| Data Analytics | 4 | 12,000 – 28,000 |

## Payment Flow

```
User clicks "Apply & Pay"
→ EnrollmentModal opens (step 1: personal info)
→ Validates with Zod schema
→ Step 2: summary review
→ "Proceed to Payment" button
  → POST /api/enrollments (saves record, payment_status: pending)
  → window.open(TREASURY_PAY_URL + params, '_blank')
→ Step 3: confirmation UI
→ Treasury webhook → updates payment_status: succeeded
```

## Notes

- Treasury redirect uses `reference_type: 'digitika_enrollment'` for tracking
- Idempotency not yet implemented on enrollment API — add in Sprint 8
- Installment plans not yet supported in UI (Code-Starter has them) — Sprint 6
