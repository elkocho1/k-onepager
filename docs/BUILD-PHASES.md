# Build-Phasen K+ Onepager

Jede Phase hat eine eigene Datei in `docs/phases/` mit Ziel, Aufgaben, Definition of Done und Prüfschritten. Eine Phase ist erst fertig, wenn alle DoD-Punkte abgehakt sind und `npm run build` grün ist. Danach: Status hier eintragen, committen, nächste Phase.

Aufruf in Claude Code, z. B.: `Lies CLAUDE.md und docs/phases/PHASE-0-setup.md und führe Phase 0 aus.`

| Phase | Inhalt | Ergebnis | Status |
|---|---|---|---|
| 0 | [Setup](phases/PHASE-0-setup.md) – Astro, Tokens, Fonts, Assets, Base-Layout, Content-Loader | Leere Seite mit Fonts, Meta, JSON-LD; Build grün | fertig |
| 1 | [Rahmen](phases/PHASE-1-rahmen.md) – Nav, Hero, Footer, Impressum/Datenschutz-Seiten | Seite mit Kopf und Fuß, Anker funktionieren | fertig |
| 2 | [Vision · Mission · Marquee](phases/PHASE-2-vision-mission-marquee.md) | Drei statische Sektionen | offen |
| 3 | [Warum K+](phases/PHASE-3-warum-kplus.md) – Karten-Slider (statisch scrollbar) | Sektion Desktop + Mobile | offen |
| 4 | [Portfolio](phases/PHASE-4-portfolio.md) – Logo-Wall + Spotlight mit Umschaltung | Sektion inkl. Klick-Logik | offen |
| 5 | [Schwerpunkte · Founder · CTA](phases/PHASE-5-schwerpunkte-founder-cta.md) | Restliche Sektionen statisch | offen |
| 6 | [Responsive](phases/PHASE-6-responsive.md) – Mobile-Frame 1:1, Zwischen-Breakpoints | Alle Sektionen bei 390 / 768 / 1024 / 1440 / 1920 sauber | offen |
| 7 | [Animationen](phases/PHASE-7-animationen.md) – GSAP, Lenis, Hex-Cursor, reduced-motion | Alle 15 Animationen aus der Liste | offen |
| 8 | [SEO · Performance · Deploy](phases/PHASE-8-seo-deploy.md) | Lighthouse ≥ 95, Sitemap, OG, GitHub Action → IONOS | offen |

## Reihenfolge und Abhängigkeiten

- 0 → 1 → 2 → 3 → 4 → 5 sind sequenziell (jede Sektion baut auf den Tokens/Komponenten davor auf).
- 6 (Responsive) erst nach 5, damit alle Sektionen einmal komplett stehen. Innerhalb der Phasen 1–5 wird trotzdem schon der Mobile-Aufbau grob angelegt (Spalten stapeln), Feinschliff in 6.
- 7 (Animationen) strikt nach 6 – nie Animationen in eine Sektion einbauen, bevor sie statisch abgenommen ist.
- 8 kann teilweise parallel vorbereitet werden (Deploy-Action ohne Secrets), Livegang erst nach Freigabe.

## Abnahme pro Phase (Standard-Prüfung, gilt für alle)

1. `npm run build` ohne Fehler und Warnungen.
2. `npm run preview`, Seite bei 1920 und 390 px Breite ansehen (Playwright-Screenshot in `docs/screens/phase-N-*.png` ablegen, falls Playwright verfügbar ist, sonst manuell).
3. Kein Text hart im Code – Stichprobe `grep -rn "Build beyond" src/` darf nur `de.json`-Zugriffe treffen.
4. HTML-Validität: eine `h1`, `h2` je Sektion, `alt` an allen Bildern.
5. Status in dieser Tabelle aktualisieren, Commit mit Präfix der Phase, z. B. `feat(phase-3): warum k+ section`.

## Status-Log

_(Claude Code trägt hier je Phase Datum, Commit-Hash und Besonderheiten ein.)_

### Phase 0 – Setup · 2026-09-09 · Commit `bec2aed`

- Stack: Astro 5.18.2 (CLAUDE.md: „neueste 5.x"), @astrojs/sitemap 3.7.4, sharp 0.35.4, gsap 3.15, lenis 1.3.26; Dev: @types/node, @astrojs/check, typescript. `npm run build` und `npm run check` grün.
- **Hinweis Astro-Version:** `npm audit` meldet für alle Versionen ≤ 7.2.7 eine kritische Advisory-Sammlung; die 5.x-Linie erhält keine Fixes mehr (aktuell 7.3.2). Für den statischen Build nicht akut, Upgrade-Entscheidung auf 7.x vor Phase 8 (Deploy) treffen.
- Icons Warum-K+: `building`, `project`, `network` per Figma MCP als SVG exportiert und bereinigt (viewBox 0 0 50 50, `currentColor`). `partnership` (Node 139:85) und `capital` (Node 75:528) sind im Figma nur Rasterbilder in Maskengruppen → Platzhalter-Kreise mit TODO; die PNGs (512×512, transparent) liegen in `_material/figma-export/`.
- K+-Marke: Figma Node 139:34 enthält nur ein PNG → `public/logos/kplus.png` als Interim (674×370, transparent), `favicon.svg` = teal Quadrat mit TODO. SVG-Marke beim Kunden anfordern.
- Logos: `Place.png` und `vynci.png` haben entgegen ASSETS.md **keinen Alphakanal** (weißer Hintergrund) → `scripts/prepare-images.mjs` stellt Weiß frei. `i-pro.jpeg` bleibt farbig (`mask: false` in `de.json`). Alle Logo-Pfade in `de.json` auf die realen Endungen gesetzt, `nav.logo` ergänzt.
- Fonts: 5 WOFF2 in `public/fonts/`, Preload Regular + Medium. Prüfung ohne Playwright (nicht installiert): Preview-Server per Astro-API gestartet, alle Font-URLs mit HTTP 200 / `font/woff2` bestätigt. Kein Screenshot in `docs/screens/`.
- Scaffold-Hinweis: `npm create astro .` legte trotz `.` einen Unterordner an; Dateien wurden in den Root verschoben.

### Phase 0 – Upgrade auf Astro 7 · 2026-09-09 · Commit `b54cf28`

- Astro 5.18.2 → **7.3.2** nach den offiziellen Guides „Upgrade to v6" und „Upgrade to v7" (`npx @astrojs/upgrade` bricht nicht-interaktiv an der Rückfrage ab → `npm install astro@7.3.2`). @astrojs/sitemap 3.7.4 und @astrojs/check 0.9.10 waren bereits die zu 7.x passenden Versionen; sharp 0.35.4 entspricht Astros optionaler Abhängigkeit.
- Relevante Breaking Changes geprüft: Node ≥ 22.12 (vorhanden: 24.14), Vite 8 (keine eigenen Plugins), Rust-Compiler (JSON-LD-`<script>` explizit geschlossen; keine ungeschlossenen Tags), `compressHTML: 'jsx'` als neuer Default (Inline-Elemente in Templates auf einer Zeile halten, Hinweis in CLAUDE.md), Sätteri-Markdown und `@astrojs/db` nicht betroffen, keine `experimental`-Flags in der Config.
- Ergebnis: `npm run build` grün (1 Seite, Sitemap), `npm run check` 0 Fehler / 0 Warnungen, `npm audit` **0 Schwachstellen** (vorher 3: 1 critical, 1 high, 1 low). CLAUDE.md nennt als Stack jetzt die aktuelle Major-Version (7.x).

### Phase 1 – Rahmen · 2026-09-09 · Commit `b689449`

- Neu: `Nav.astro`, `Hero.astro`, `Footer.astro`, `Button.astro` (Props `href`, `label`, `variant`; restliche Attribute werden auf das `<a>` durchgereicht), Layout `Legal.astro` mit den Seiten `/impressum` und `/datenschutz` (Platzhaltertext, `noindex` über neue Base-Prop), `src/lib/images.ts` (`resolveImage()` mappt `de.json`-Pfade `/images/*` auf `src/assets/images/` für astro:assets; `publicImageSize()` liest Logo-Maße für `width`/`height`).
- `de.json` ergänzt: `nav.ariaLabel`, `footer.linksLabel`, `legal.*` (Titel, Meta, Platzhalter, Zurück-Link) sowie der Zeilenumbruch `\n` in `hero.text` nach dem ersten Satz (Spec Abschnitt 1, Figma).
- Tokens ergänzt: `--c-night-a30/-a40/-a85`, `--c-teal-a40`, `--nav-top`, `--nav-height`, `--nav-height-scrolled`, `--scroll-offset` (= `scroll-padding-top` 96 px in global.css).
- Hero: `<Picture>` mit AVIF/WebP (768–2560 px), `loading="eager"`, `fetchpriority="high"`, `width`/`height` aus der Quelle; Verläufe als `::before`/`::after` (je 50 % Höhe = 469/936). Mobile: Outline-Zeile ohne 10-px-Tracking (Mobile-Frame 242:22), Buttons volle Breite / 46 px, Block unten ausgerichtet (Buttons enden bei 725 wie im Frame). Feinschliff der Mobile-Abstände in Phase 6.
- K+-Logo-PNG per `sharp().trim()` auf 481×165 beschnitten (der Figma-Export hatte transparenten Rand) → in der Nav 175×60, Spec 174×60.
- Hinweis: `resolveImage()` nutzt ein eager `import.meta.glob`; dadurch landen derzeit auch ungenutzte Original-JPGs in `dist/_astro/` (~1,2 MB). Ab Phase 5 sind alle Bilder in Verwendung.
- Abnahme: `npm run build` (3 Seiten) und `npm run check` grün. Neues Skript `npm run check:phase -- 1 index impressum` (`scripts/phase-check.mjs`): startet `astro preview` als IPv4-Daemon, Lighthouse-Accessibility je Seite für Desktop 1920 und Mobile 390 (Screen-Emulation), Full-Page-Screenshots nach `docs/screens/` (gitignored). Ergebnis: index **100/100**, impressum 96/100, datenschutz 96/100. Einziger Abzug (`color-contrast`): Nav-Button Magenta `#FF00FF` auf Night = 4,17:1, AA verlangt 4,5:1 für 16-px-Text – Designwert aus dem Manual; auf dem Hero-Foto nicht messbar, auf flachem Hintergrund (Rechtsseiten) schon. → Hinweis an Design (Option: leicht helleres Magenta oder größere Schrift), kein Code-Workaround.
- Gelernt (Windows): Chrome `--headless=new` hängt mit `--virtual-time-budget`; Chrome erzwingt ~480 px Mindest-Fensterbreite (390er-Screenshots nur per Emulation); `astro preview` ist in Astro 7 ein Daemon (`astro preview stop`); die `preview()`-JS-API ignoriert `server.host` und lauscht nur auf `::1`.
