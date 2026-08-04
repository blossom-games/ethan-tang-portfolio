# Ethan Tang — Portfolio

Award-worthy portfolio for **Ethan Tang**, student at Lynbrook High School.

## Stack

- Vanilla HTML / CSS / JS — zero build step, instant deploy
- [GSAP](https://gsap.com) + ScrollTrigger — scroll reveals, parallax, pinned timeline
- [Lenis](https://github.com/darkroomengineering/lenis) — buttery smooth scrolling
- CSS cascade layers + custom properties — design tokens, fluid typography (`clamp()`), glassmorphism, OKLCH-ish palette
- Dark/light theme — system-aware, `localStorage` persistence
- `prefers-reduced-motion` — full support via `gsap.matchMedia()`

## Run locally

Any static server works:

```bash
# Python
python -m http.server 8080

# or VS Code Live Server, or:
npx serve .
```

Then open http://localhost:8080

## Customize

Replace every `[...]` placeholder in `index.html` with your real content:

| Section | What to fill |
|---------|--------------|
| Hero stats | `data-count` values on `.stat__num` |
| About | Your bio paragraphs |
| Academics | Courses, interests, honors |
| Projects | Names, descriptions, tags (add cards) |
| Achievements | Year, title, description per `.timeline__item` |
| Skills | `.skill-pill` entries |
| Contact | Your email in the `mailto:` link |
| Footer | GitHub / LinkedIn URLs |

Optional swap-ins:
- `index.html` hero: replace the gradient `.hero__bg` with a real image/WebP for an LCP win
- Fonts: swap Google Fonts link for self-hosted WOFF2 + `font-display: swap`

## Performance checklist

- [x] Deferred JS, no render-blocking
- [x] No CLS — fixed aspect ratios, reserved space
- [x] GPU-friendly transforms only (`transform`/`opacity`)
- [x] Lazy cursor/parallax off for `prefers-reduced-motion`
- [x] `content-visibility`-friendly structure, minimal DOM

## Deploy

### Netlify
Drag & drop the folder at [app.netlify.com/drop](https://app.netlify.com/drop) — done. `netlify.toml` included.

### Vercel
```bash
npx vercel
```

### GitHub Pages
Push to a repo → Settings → Pages → deploy from `main` branch root.

## License
© Ethan Tang. All rights reserved.
