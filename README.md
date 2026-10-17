# Wayne — Personal Site

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JS](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![deps](https://img.shields.io/badge/dependencies-0-4c1?style=flat-square)
![build](https://img.shields.io/badge/build-node%20scripts%2Fbuild.mjs-4c1?style=flat-square)

A personal site built the boring way: three files of CSS, three of JavaScript, one HTML page.
No framework, no bundler, no `node_modules`, no build output in the repository. It deploys by
being copied to a branch.

---

## Why it looks the way it does

The brief I gave myself was **tactile minimalist tech**: the warmth of an editorial page, the
precision of a developer tool. Concretely, that means a few rules held consistently.

| Decision | Reason |
| --- | --- |
| Warm paper `#FAF9F5` / obsidian `#141413` | Two palettes, both low-chroma. Nothing is pure white or pure black for long stretches. |
| Terracotta `#C15F3C` as the only accent | One accent means colour always signals something. No gradients used as decoration. |
| Serif headings (Newsreader), sans body (Inter), mono detail (JetBrains Mono) | Three voices; each has one job. Mono is reserved for labels, tags, and terminal output. |
| 1px hairlines, `rgba` at 10% | Structure is drawn, not shadowed. Shadows only appear on hover. |
|`cubic-bezier(.22, 1, .36, 1)` | Ease-out everywhere. Nothing bounces; nothing overshoots. |

What I deliberately kept out: neon gradients, glassmorphism on every surface, floating
illustration blobs, and the usual "crafting digital experiences" register. The micro-effects
that survived are the ones that reward attention rather than demand it — a grid that lights up
under the cursor, a border that tracks the pointer across a card, a film grain that shifts
slowly enough to feel like paper.

## Architecture

```
.
├── index.html                 # single page, semantic sections, no template layer
├── assets/
│   ├── css/
│   │   ├── tokens.css         # palette, type scale, spacing, easing — the whole design system
│   │   └── main.css           # components: nav, hero, bento, log, terminal, footer
│   ├── js/
│   │   ├── theme.js           # light/dark, persisted, system default, no flash on load
│   │   ├── motion.js          # pointer-lit grid, card spotlight, staged reveals, scrollspy
│   │   └── terminal.js        # interactive profile terminal (commands are data, not markup)
│   └── favicon.svg
├── scripts/build.mjs          # static audit + dist copy
└── package.json
```

Everything is a plain classic script — no ES modules — so `index.html` also opens correctly
straight off the filesystem. The three scripts share no globals.

### The three effects worth explaining

**Cursor-lit grid.** A fixed layer holds two `linear-gradient`s at 66px. A `radial-gradient`
mask centred on `--px / --py` decides how much of it is visible, and `motion.js` writes those
two custom properties inside a `requestAnimationFrame`. One rAF-throttled listener, no layout
reads per frame beyond the card bounds.

**Card border illumination.** Each card has a `::before` at `inset: 0` with `padding: 1px`, a
radial gradient background, and `mask-composite: exclude` — so the gradient only paints the
1px ring, never the interior. The interior wash is a separate `::after` at lower opacity.

**Grain.** An inline `feTurbulence` SVG as a data URI, `mix-blend-mode: multiply` on light and
`screen` on dark, drifting across six steps over seven seconds. It never animates opacity or
background-position — only `transform`, so it stays on the compositor.

## Local

```bash
npm run dev      # http://localhost:4173
npm run build    # audit + copy to dist/
npm run check    # same audit, warnings become errors
```

`npm run build` is a static validator disguised as a build step. It fails on a missing asset, a
dead anchor, unbalanced CSS braces, an undeclared `var(--token)`, or a JS syntax error — and it
warns if an emoji or a piece of AI-filler phrasing ever makes it into the copy.

## Deploy

**GitHub Pages** — Settings → Pages → *Deploy from a branch* → `main` / `/root`. The
`.nojekyll` file is already in place; a push is a deploy.

**Vercel / Netlify** — framework preset *Other*, build command `npm run build`, output
directory `dist`.

**Anywhere else** — copy `index.html` and `assets/` onto any static host. There is nothing to
compile.

## Before you ship it

Four things in this repository are placeholders I filled in from my own notes:

1. **Contact links** — `index.html` footer has GitHub and Source only. Add email or socials there.
2. **The `contact` command** in `assets/js/terminal.js` — update the line it prints.
3. **Hero copy** — the lede and the three facts under it should match what you're actually doing this quarter.
4. **Log entries** — real dates, real incidents. The section is only worth having if the notes are honest.

Content is authored directly in `index.html`. There is no CMS and no data file; if the work
section grows past five entries, that is the point at which to introduce one.

## Accessibility & performance

- Light and dark palettes both hit WCAG AA for body text; `prefers-color-scheme` is respected on first load, and `prefers-reduced-motion` disables grain drift, reveals, and typing.
- Skip link, visible focus rings, `aria-pressed` on the theme toggle, `aria-live` on terminal output, and real `<time datetime>` elements in the log.
- No WebGL, no scroll-jacking, no layout-affecting animation. Everything on screen is either a `transform`, an `opacity`, or a masked gradient.

## License

MIT. Take the CSS tokens if they're useful.
