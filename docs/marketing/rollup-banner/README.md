# Codevertex roll-up banner (850 × 2000 mm)

| File | Use |
|------|-----|
| `codevertex-rollup-850x2000mm.pdf` | **Print file** — true size 850 × 2000 mm, vector text |
| `codevertex-rollup-850x2000mm.jpg` | Raster version, 3400 × 8000 px (~100 dpi at full size) |
| `codevertex-rollup-preview.png` | Small preview for sharing |
| `banner.html` | Editable source (1 CSS px = 1 mm) |
| `design-philosophy.md` | "Plum Grid" design direction |

Typeface: Helvetica Neue / Helvetica, falling back to Inter. Brand plum `#801E68` sampled from `public/images/logo.png`.

Re-render after editing (needs Playwright + Chromium):

```bash
node docs/marketing/rollup-banner/render.js "$PWD/docs/marketing/rollup-banner" 4 pdf
```

Print notes: keep the bottom ~60 mm clear (it sits inside the stand cassette); ask the printer
whether they need bleed — add 5 mm by extending the background colours if so. The small
developer photo (`assets/2_up.jpg`) was upscaled from a 299 px source; swap in a higher-resolution
original before final print if available.
