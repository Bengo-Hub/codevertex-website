# Sprint 9: website redesign, real imagery and the enquiry notices

**Status:** Done, with open items (Oct 2026)

## Delivered
- [x] Redesign on the Codevertex Africa Limited brand: plum and gold tokens, Bricolage Grotesque and
  Figtree, soft glass surfaces, no gradients or AI-style decoration. Tagline "Architecting Africa's
  Digital Excellence". Digitika first in the navigation (`2a2277a`, `0318134`).
- [x] Every page and form audited: copy rewritten in plain language and inclusive of Kenya and
  East Africa, facts checked against the services, the old paybill removed, docs links point to
  docs.codevertexafrica.com user guides.
- [x] Fake SVG mockups deleted. Product and service images are real screens or branded app
  mockups on devices, over real Kenyan photos; people shown are African (`docs/image-credits.md`).
- [x] Contact form: phone required and normalised, the publish result recorded (`noticeSentAt`),
  resend from `/admin/contacts`. notifications-api sends the WhatsApp reply
  (`codevertex_enquiry_received_v1_btn`, synced to Meta) and emails the team
  (`platform/website_enquiry`).
- [x] Projects seeded with photos: ALEHU ICDL training, Rubana weighbridges (Tanzania), Migori
  library, Rongo CCTV, Kanyonyo ANPR, MUCISA hackathon.
- [x] Calls and WhatsApp use +254 743 793 901 everywhere (`838a14b`).
- [x] Scenes rebuilt for the capstone products: ERP with self-service payslip, Treasury approval
  phone, marketplace storefront and checkout with real product photos, MarketFlow and Vera,
  Notifications flows, security audit, web and mobile development photos (`838a14b`).
- [x] Hero cards moved off the team's faces; updated scenes renamed so caches cannot serve the old
  pictures (`d61f0a4`).
- [x] Photo credits moved behind an info button that opens on hover, focus or tap (`beb628f`).
- [x] Image quality pass: app screens captured at 2x, screens downscaled with Lanczos before the
  perspective warp, devices brought closer, scenes exported at 2000 x 1250 and served at quality
  90 (`next.config.ts` `images.qualities`). The POS scene shows the team's POS terminal screen.

## Open items
- Dates for the ALEHU, Rubana and Rongo projects (seeded as drafts dated 2026-09-29).
- A non-client TruLoad demo login, so the TruLoad scene can show the dashboard instead of the
  sign-in page.
- The Notifications app header reads "Platfrom Admin" (typo in the app, visible in the
  notifications scene). Fix belongs to notifications-ui.
- The cybersecurity and mobile development course covers keep their file names because the paths
  live in each course's database row; browsers and Cloudflare may show the old covers until their
  caches expire.
- Scene build scripts are kept outside the repo; rebuilding needs the inputs listed in
  `docs/image-credits.md`.
