# Codevertex roll-up banner (850 × 2000 mm)

| File | Use |
|------|-----|
| `codevertex-rollup-850x2000mm.pdf` | **Print file** — true size 850 × 2000 mm, vector text |
| `codevertex-rollup-850x2000mm.jpg` | Raster version, 3400 × 8000 px (~100 dpi at full size) |
| `codevertex-rollup-preview.png` | Small preview for sharing |
| `banner.html` | Editable source (1 CSS px = 1 mm) |
| `design-philosophy.md` | "Plum Grid" design direction |

Typeface: Helvetica Neue / Helvetica, falling back to Inter.

Palette: Codevertex plum `#7A1D63` / deep plum `#3E0E33`, with Maskani door gold `#C8963E`,
light gold `#E7C27A` and dark orange `#D9661F` as accents (gold and plum from
`shared-docs/brand/maskani`).

The hero product scene and service icons are drawn in HTML/SVG, so they print sharp at full size
and carry no third-party licence. To use a photo instead, replace the `.hero` contents with an
`<img>` from `assets/` (use at least 3400 px wide for print).

Re-render after editing (needs Playwright + Chromium):

```bash
node docs/marketing/rollup-banner/render.js "$PWD/docs/marketing/rollup-banner" 4 pdf
```

Print notes: keep the bottom ~60 mm clear (it sits inside the stand cassette); ask the printer
whether they need bleed — add 5 mm by extending the background colours if so.
