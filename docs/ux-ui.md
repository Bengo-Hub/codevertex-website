# Codevertex website design system

The public site follows the Codevertex Africa Limited brand as printed on the 2026 roll-up banner:
plum from the logo, a deep night plum for dark sections and gold for the accent. The tagline is
"Architecting Africa's Digital Excellence" and is never paraphrased.

## Colour tokens

Defined once in `src/app/globals.css` as HSL variables and exposed as Tailwind colours in
`tailwind.config.ts`. Colours are solid: the site has no gradients, glows, blurred blobs or glass.

| Token | Light | Use |
|-------|-------|-----|
| `--primary` | plum `#9B2C6B` | Buttons, links, icons |
| `--primary-deep` | `#7A1D63` | Button hover and pressed state |
| `--night` | `#1E0F1B` | Footer, call-to-action bands, the Maskani band |
| `--gold` | `#C8963E` | Accent on night sections only (gold buttons, small labels). Never text on white: contrast is too low |
| `--foreground` | ink `#1D1A22` | Body text |
| `--secondary` / `--muted` | paper `#F6F4F7` | Alternate section background |
| `--border` | `#E7E2EA` | Dividers and outlines |

Dark mode redefines the same tokens under `.dark`.

## Type

- Display: Bricolage Grotesque (`font-display`), for headings only, weights 600 to 800.
- Body: Figtree (`font-sans`).
- Headings are sentence case. No all-caps eyebrow labels above headings, no single word picked out
  in another colour, no "→" in button text.

## Layout rules

- Every public page opens with `components/site/PageIntro.tsx`: a left-aligned headline, one lead
  paragraph and an optional image or actions beside it.
- Lists are lists, not identical card grids: products are a bordered directory, services and track
  record are divided lists, photos carry captions.
- Numbered markers only where the content is a sequence (Digitika enrolment steps, attachment
  "How it works").
- Motion: one fade on the home hero and the confirming tick on payment success. Nothing else animates
  on its own; `prefers-reduced-motion` turns all motion off.
- Buttons: `default` (plum), `outline`, `ghost`, and on night sections `gold` and `outline-light`.

## Images

- Real photos only. No illustrations, mock dashboards or AI-generated people.
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
