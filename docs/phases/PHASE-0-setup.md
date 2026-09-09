# Phase 0 – Setup

**Ziel:** Lauffähiges Astro-Projekt mit Tokens, Fonts, aufbereiteten Assets, Base-Layout (Meta, OG, JSON-LD) und typisiertem Content-Loader. Noch keine Sektionen.

**Input:** `CLAUDE.md`, `docs/DESIGN-SPEC.md` (Tokens, Typo), `docs/ASSETS.md`, `content/de.json`, `_material/`.

## Aufgaben

1. **Projekt anlegen** – im Repo-Root (dieser Ordner), nicht in einem Unterordner:
   `npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git` (bestehende Dateien behalten), dann `npm install`.
   Dependencies: `astro`, `@astrojs/sitemap`, `sharp`, `gsap`, `lenis`. Dev: `@types/node`.
   `astro.config.mjs`: `site: 'https://www.kplus.de'` (aus `de.json` `meta.siteUrl` – vorerst Platzhalter), `output: 'static'`, `integrations: [sitemap()]`, `build.inlineStylesheets: 'auto'`.
2. **`.gitignore`**: `node_modules/`, `dist/`, `.astro/`, `_material/`, `docs/screens/`, `.env*`.
3. **Ordnerstruktur** laut `CLAUDE.md` anlegen (leere Komponenten-Dateien erst in den jeweiligen Phasen).
4. **Content-Loader** `src/lib/content.ts`: `import de from '../../content/de.json'` mit `resolveJsonModule`; TypeScript-Typ `SiteContent` aus der JSON ableiten (`typeof de`), Export `export const content = de as SiteContent`. Hilfsfunktion `nl2br(text)` für `\n` in `hero.text` und `cta.text` (gibt Array von Zeilen zurück, kein `set:html`).
5. **Tokens** `src/styles/tokens.css`: alle Werte aus DESIGN-SPEC.md „Tokens" + Typo-Skala als CSS-Variablen (`--fs-display`, `--fs-h2`, `--fs-h3`, `--fs-body`, `--fs-eyebrow`, `--fs-button` mit `clamp()` Mobile→Desktop), `--ease-out: cubic-bezier(.22,1,.36,1)`, `--dur-fast: 200ms`, `--dur-base: 300ms`.
6. **Global** `src/styles/global.css`: Reset (box-sizing, margin 0, `img { display:block; max-width:100% }`), `html { background: var(--c-night); color: #fff; font-family: var(--font-brand); -webkit-font-smoothing: antialiased }`, `body { overflow-x: hidden }`, `.container { width: min(var(--container), 100% - 2*var(--gutter)); margin-inline: auto }`, Utility-Klassen `.eyebrow`, `.h2`, `.body`, `.btn`, `.btn--primary`, `.btn--secondary`, `.outline-text` (`-webkit-text-stroke`), `.visually-hidden`. `@media (prefers-reduced-motion: reduce)` → `*, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important }`.
7. **Fonts**: WOFF2 nach `public/fonts/` kopieren (Regular, Medium, Bold, Heavy, Book), `@font-face`-Block in `tokens.css` (weights 400/500/700/800/350, `font-display: swap`), Preload für Regular + Medium im Layout.
8. **Assets aufbereiten** laut `docs/ASSETS.md`: Script `scripts/prepare-images.mjs` (sharp) schreibt verkleinerte JPGs nach `src/assets/images/` (inkl. `portfolio/*` Platzhalter). Logos nach `public/logos/` (Kappes-SVG, PNGs mit Zielnamen), `de.json`-Logopfade auf die tatsächlichen Endungen setzen. Icons-Ordner `public/icons/warum/` anlegen; falls die SVGs noch nicht aus Figma exportiert sind, je Icon ein einfaches Platzhalter-SVG (Kreis) mit `fill="currentColor"` und Kommentar `<!-- TODO: export from Figma 139:87 -->`.
9. **Base-Layout** `src/layouts/Base.astro`: Props `title`, `description`, `canonical`, `ogImage`; `<html lang="de">`, Meta (charset, viewport, description, robots), OG/Twitter-Tags, Canonical, Favicon, Font-Preloads, `tokens.css` + `global.css`, JSON-LD `Organization` aus `de.json` `meta.organization` (Name, Adresse als `PostalAddress`, `founder` als `Person`, `url`, `logo`). Slots: `default`, `head`. `<main>` im Layout, `Nav` und `Footer` werden in Phase 1 ergänzt.
10. **Seiten**: `src/pages/index.astro` rendert Base mit Titel/Description aus `de.json` und einem Platzhalter-`<h1>` (wird in Phase 1 durch Hero ersetzt). `robots.txt` (`Allow: /`, `Sitemap: {site}/sitemap-index.xml`) und `favicon.svg` (K+-Marke, falls vorhanden; sonst teal Quadrat als Platzhalter) in `public/`.
11. **`npm run build`**, dann `npm run preview` und prüfen, dass Fonts laden (Network-Tab / Playwright).

## Definition of Done

- [x] `npm run build` läuft ohne Fehler, `dist/index.html` enthält Meta, OG, JSON-LD, Font-Preloads
- [x] `content/de.json` wird typisiert importiert; TypeScript-Fehler bei falschen Keys
- [x] `tokens.css` enthält alle Farben, Font-Faces, Typo-Skala mit `clamp()`, Abstände
- [x] `public/fonts/` mit 5 WOFF2, `public/logos/` mit 6 Logos, `src/assets/images/` mit Hero/Vision/Schwerpunkte/Founder + 6 Portfolio-Bilder, `public/icons/warum/` mit 5 SVGs (oder Platzhaltern)
- [x] `.gitignore` schließt `_material/` aus
- [x] Seite bei `npm run preview` zeigt night-Hintergrund und KMR Apparat in der Platzhalter-`h1`
- [x] Status in `docs/BUILD-PHASES.md` auf „fertig", Commit `chore(phase-0): astro setup, tokens, assets`

## Nicht in dieser Phase

Keine Sektionen, keine Nav, keine Animationen, kein Tailwind.
