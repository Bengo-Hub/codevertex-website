# Image sources

Every image on the site, where it came from and how it was prepared. Photos are cropped, resized
to at most 1800 px wide and saved as WebP (quality 72 to 80). Saving only the pixel data drops all
EXIF, including GPS. Crops remove number plates, burned-in timestamps and the old
"CodeVertex IT Solutions" logo.

## Our own photos

| File | Source | Notes |
|------|--------|-------|
| `photos/team-mucisa-2025.webp` | MUCISA Hackathon 2025, `DSC_0028` | Team in company shirts, Maseno University |
| `photos/hackathon-*.webp` | MUCISA Hackathon 2025 selection | Photographer watermark cropped out |
| `photos/field-anpr-install.webp` | ANPR install, Kanyonyo weighbridge, Jan 2025 | Cropped below the old vest logo |
| `photos/field-cctv-mast.webp` | Camera alignment on site | Cropped above the old vest logo |
| `photos/lab-camera-bench.webp`, `photos/network-rack.webp` | Bench setup and a rack we installed | |
| `photos/weighbridge-demo.webp` | KeNHA stand, Mombasa ASK show, Sep 2024 | Cropped to leave out a vehicle plate |
| `photos/rongo-cctv-*.webp`, `photos/rubana-*.webp` | Copies of project photos used on /integrations | Same files as the project seed |
| `photos/brand-vest.webp`, `hub.jpg` | Company vest at the office, Oct 2026 | `hub.jpg` keeps the path live blog posts use |
| `prisma/seed/project-photos/**` | Project photos shared by the team, Sep 2026 | Plate (Rongo) and timestamp (Migori) cropped out |
| `courses/icdl-l2.jpg`, `courses/icdl-l4.jpg` | ALEHU ICDL training photos | Replace stock covers that showed non-African people |
| `courses/ai-business.jpg`, `ccna-1.jpg`, `ccna-cert.jpg`, `ml-python.jpg`, `teens-web.jpg`, `advanced-analytics.jpg` | Our hackathon, rack and event photos | Same reason |

## Product scenes (`public/images/products/*-scene.webp`)

Two kinds of screen go onto the devices:

- Real screens captured from the codevertex-demo tenant: POS, Inventory, Logistics, Treasury, the
  ERP reports page and Notifications monitoring.
- Branded mockups built in HTML with sample data, for screens the demo tenant cannot show yet: the
  MarketFlow sequence map, the Vera chat, the ERP self-service phone, the Notifications delivery
  flows, the marketplace storefront and checkout, the Treasury approval phone, the security audit
  and the developer IDE views. Their app chrome copies the real apps, and the store logos are
  the retail and hospitality tenants' own.

| Scene | Device and backdrop | Backdrop licence |
|-------|---------------------|------------------|
| treasury | Real photo of a finance officer at her laptop: Treasury dashboard on the laptop, the approval screen on the phone on her desk, microphone retouched out | CC BY-SA 4.0, Jaokov. Scene shared under CC BY-SA 4.0, credited where shown |
| pos | Rendered counter terminal and receipt printer in front of a real Kenyan supermarket | CC BY-SA 4.0, Mauryndinar. Scene under CC BY-SA 4.0, credited where shown |
| web-apps | Real photo of two developers at the Wikimania 2025 hackathon in Nairobi, storefront and code on the laptop, a Codevertex sign on the wall | CC BY-SA 4.0, JMcRae-WMF. Scene under CC BY-SA 4.0, credited where shown |
| mobile-apps | Real photo of a developer at the same hackathon, emulator, code and terminal on the laptop | CC BY-SA 4.0, JMcRae-WMF. Scene under CC BY-SA 4.0, credited where shown |
| ai | Laptop with the MarketFlow map and a phone with Vera, over the Kisumu skyline | CC BY 4.0, Will Ochieng', credited where shown |
| inventory | Laptop over a Naivas supermarket aisle | CC0, safaritravelplus |
| erp-ess, marketflow-vera | Laptop or tablet with a phone over a Kisumu rooftop view | CC0, Leo Hempstone |
| notifications-flows | Laptop and tablet over Oginga Odinga Street, Kisumu | CC0, Leo Hempstone |
| marketplace | Laptop and phone over Mega Plaza, Kisumu | CC0, Leo Hempstone |
| logistics | Laptop over Mombasa port staff | Public domain, Ministry of East African Affairs, Commerce and Tourism |
| truload | Laptop over our own Kanyonyo install photo | Our photo |
| security-audit | Laptop with the audit terminal and threat analytics over a server hall | CC0, Derrick Coetzee |

Product photos inside the storefront and checkout mockups (frying pan, charger, cappuccino,
serum, lipsticks, jumper cables) are CC0 from rawpixel, StockSnap and Flickr, found through
Openverse.

Scripts that rebuild the scenes are kept with the session notes, not in the repo; the inputs are the
screens above and the listed backdrops.

## Free-licence photos

| File | Source | Licence |
|------|--------|---------|
| `photos/kisumu-mega-plaza.webp` | "Mega Plaza Kisumu", Leo Hempstone, Wikimedia Commons | CC0 |
| `photos/data-centre.webp` | "A view of the server room at The National Archives", The National Archives (UK) | CC BY 3.0, credited on the card |
| `courses/kids-scratch.jpg`, `courses/kids-games.jpg` | "Looking at the laptop 02", "Students using a computer laptop", Kwameghana | CC0 |
| `courses/cybersec.jpg` | Our own render: a hardening-check terminal and standards badges | Ours |
| `courses/mobile-dev.jpg` | Our mobile IDE and checkout renders over the Kisumu rooftop view | CC0 backdrop, Leo Hempstone |

## Logos

- Payment providers (M-Pesa, Airtel Money, PayHero, Paystack) come from shared-ui-lib's
  `payments` brand marks, the same source every Codevertex app uses.
- `logos/google.svg`: Google 2015 logo, Wikimedia Commons (trademark, used to name an employer of
  Digitika graduates).
- Client and partner logos come from the tenants' own branding (auth-api) or the files they gave us.

## Left out on purpose

- AI-generated images: the "generated by ai" folder, the 2025 graduation picture, the Customer
  Service Week poster, the business-profile speaker slides, the POS billboard composite of
  Oginga-Odinga Road (the street is real, the billboard was generated).
- Photos showing the old "CodeVertex IT Solutions" roll-up or shirts in readable size.
- Anything private: ID documents, signatures, learners' certificates.
- Unsplash and Pexels: both block automated access, so no images were taken from them.
