# Codevertex website design system

The public site follows the Codevertex Africa Limited brand as printed on the 2026 roll-up banner:
plum from the logo, a deep night plum for dark sections and gold for the accent. The tagline is
"Architecting Africa's Digital Excellence" and is never paraphrased.

## Colour tokens

Defined once in `src/app/globals.css` as HSL variables and exposed as Tailwind colours in
`tailwind.config.ts`. Surfaces are solid tints and frosted glass (`.glass` over light surfaces and
photos, `.glass-dark` on night sections) with soft neutral shadows (`.shadow-soft`, `.shadow-lift`).
There are no colour gradient washes, coloured glows or blurred colour blobs (the user asked for a
glassy, soft look on 2026-10-25; glass is allowed, gradients still are not).

| Token | Light | Use |
|-------|-------|-----|
| `--primary` | plum `#9B2C6B` | Buttons, links, icons |
| `--primary-deep` | `#7A1D63` | Button hover and pressed state |
| `--night` | `#1E0F1B` | Footer, call-to-action bands, the Maskani band |
| `--gold` | `#C8963E` | Accent on night sections only (gold buttons, small labels). Never text on white: contrast is too low |
| `--foreground` | ink `#1D1A22` | Body text |
| `--secondary` / `--muted` | paper `#F6F4F7` | Alternate section background |
| `--border` | `#E7E2EA` | Dividers and outlines |
| `--mist` | `#F8F0F4` | Soft plum-tinted surface for page intros and alternate sections |

Dark mode redefines the same tokens under `.dark`.

## Type

- Display: Bricolage Grotesque (`font-display`), for headings only, weights 600 to 800.
- Body: Figtree (`font-sans`).
- Headings are sentence case. No all-caps eyebrow labels above headings, no single word picked out
  in another colour, no "→" in button text.

## Layout rules

- Every public page opens with `components/site/PageIntro.tsx` on the mist surface: with an image
  the text and image sit side by side, vertically centred; without one the title and lead share the
  row so it is never half empty.
- Card grids divide evenly: client services are six cards (`components/site/ServiceCards.tsx`, used
  on the home page and /services), photo grids are one wide, two, three with the first spanning, or
  two by two. Photos carry captions; licensed photos carry their credit.
- The Products page lists the core services first (POS, Books and Treasury, ERP, Inventory, Ordering,
  Logistics, TruLoad, Notifications, MarketFlow), each with its scene, then the rest of the suite.
- Numbered markers only where the content is a sequence (Digitika enrolment steps, attachment
  "How it works").
- Motion, all off under `prefers-reduced-motion`:
  - `Reveal`: blocks below the fold fade up once when scrolled into view (rendered visible on the
    server, so content never depends on JavaScript);
  - `TypedWords`: the hero headline types who the software runs (shops, hotels, clinics, schools,
    weighbridges) and settles on "African business"; screen readers get the final text;
  - `CountUp`: figures count up once in view; the server renders the real number;
  - marquee strips for customer and employer logos (pause on hover), hover lift and image zoom on
    cards, the header turning to frosted glass on scroll, smooth scrolling to anchors.
- Buttons: `default` (plum), `outline`, `ghost`, and on night sections `gold` and `outline-light`.
  Calls to action are pill shaped.

## Images

- Real photos only. No illustrations, fake dashboards or AI-generated people. Product images are
  real screens from the demo tenant placed on devices over real Kenyan backdrops (see
  `docs/image-credits.md`); where people appear they are African.
- Wording is inclusive of the whole region: "a Kenyan company working across East Africa", not
  "a Kisumu company". Kisumu appears only where it is a fact (the office address).
- Documentation links go to the public guides on docs.codevertexafrica.com (`docsUrl()` in
  `lib/constants.ts`, per-product `docs` paths in `config/services.ts`).
- Sources and processing are in `docs/image-credits.md`. Photos are WebP, at most 1800 px wide, with
  EXIF (including GPS) stripped, under `public/images/photos/`.
- The logo comes from `public/images/brand/`: `logo-full.png` on light backgrounds,
  `logo-full-light.png` on night backgrounds, `logo-mark.png` for the favicon and small uses.
- Photos showing the old "CodeVertex IT Solutions" name are cropped so it does not show, or left
  out. The MUCISA 2025 "code" shirts carry it in small print that is not legible at web size.

## Copy

Plain sentences from the customer's side, following the humanise rules: no em-dash connectors, no
"§", no narrating the product. Figures on the page are either live (businesses on the Power Suite
from auth-api, prices from subscriptions-api, course counts and projects from the database) or the
training figures confirmed in the business profile.

## Data shown live

| What | Source | Code |
|------|--------|------|
| Businesses on the Power Suite and their logos | auth-api `/api/v1/tenants/marketplace` | `lib/tenants.ts` |
| "From KES x a month" prices | subscriptions-api `/api/v1/plans` | `lib/subscriptions.ts` |
| Products, services, contact topics | `config/services.ts` | one list used everywhere |
| Projects | `project_events` table, seeded from `prisma/seed/projects.ts` | `lib/projects-server.ts` |
| Course counts | `courses` table | `DigitikaTeaser`, `/digitika` |

## Admin and portals

Admin, student and auth screens use the same tokens and fonts but keep their own layout. The
platform architecture map and website review moved from the public `/platform` page to
`/admin/platform` (staff only).
