# Build-Phasen K+ Onepager

Jede Phase hat eine eigene Datei in `docs/phases/` mit Ziel, Aufgaben, Definition of Done und Prüfschritten. Eine Phase ist erst fertig, wenn alle DoD-Punkte abgehakt sind und `npm run build` grün ist. Danach: Status hier eintragen, committen, nächste Phase.

Aufruf in Claude Code, z. B.: `Lies CLAUDE.md und docs/phases/PHASE-0-setup.md und führe Phase 0 aus.`

| Phase | Inhalt | Ergebnis | Status |
|---|---|---|---|
| 0 | [Setup](phases/PHASE-0-setup.md) – Astro, Tokens, Fonts, Assets, Base-Layout, Content-Loader | Leere Seite mit Fonts, Meta, JSON-LD; Build grün | fertig |
| 1 | [Rahmen](phases/PHASE-1-rahmen.md) – Nav, Hero, Footer, Impressum/Datenschutz-Seiten | Seite mit Kopf und Fuß, Anker funktionieren | fertig |
| 2 | [Vision · Mission · Marquee](phases/PHASE-2-vision-mission-marquee.md) | Drei statische Sektionen | fertig |
| 3 | [Warum K+](phases/PHASE-3-warum-kplus.md) – Karten-Slider (statisch scrollbar) | Sektion Desktop + Mobile | fertig |
| 4 | [Portfolio](phases/PHASE-4-portfolio.md) – Logo-Wall + Spotlight mit Umschaltung | Sektion inkl. Klick-Logik | fertig |
| 5 | [Schwerpunkte · Founder · CTA](phases/PHASE-5-schwerpunkte-founder-cta.md) | Restliche Sektionen statisch | fertig |
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
- Nachtrag `fix(phase-1)` (2026-09-09): Token `--c-magenta-text: #FF4DFF` für Magenta-Text auf Night (Eyebrows, Text der Primär-Buttons inkl. Nav-CTA; Rahmen, Glow und Aktiv-Zustände bleiben `--c-magenta`) → Kontrast 4,84:1, dokumentiert als Abweichung 8 in DESIGN-SPEC.md. `.gitattributes` mit `* text=auto eol=lf` und Binär-Regeln, Zeilenenden normalisiert (nur `kappes-group.svg` war CRLF; `prepare-images.mjs` schreibt SVGs jetzt mit LF). Hero-Eyebrow bei 14 px KMR Apparat Bold per 2×-Screenshot geprüft: rendert sauber – die Doppelung im Figma-Screenshot ist ein Artefakt versteckter Layer.

### Phase 2 – Vision · Mission · Marquee · 2026-09-09 · Commit `73a402c`

- Neu: `Vision.astro` (Grid 778/702, gap 120, `<Picture>` 342–1556 px lazy, `object-position: 60% 50%`, Mobile 1 Spalte mit Bild 342×260 zuerst), `Mission.astro` (Grid 702/778, gap 203, drei Prinzipien mit `border-left` lime, gap 50 / Mobile 24, `data-reveal-stagger`), `Marquee.astro` (dekorativ `aria-hidden`, zwei Zeilen à 55 px, Einträge je Zeile doppelt gerendert für die Endlos-Animation in Phase 7, Zeile 1 `flex-end` / Zeile 2 `flex-start`, Outline-Einträge Bold mit `--outline-color: var(--c-teal)`, Fade-Maske 522 px / Mobile 60 px, `data-marquee-direction`).
- Abstände laut Spec: Hero → Vision 80, Vision → Mission 80, Mission → Marquee 80, danach `--section-gap`. Zwischenbreakpoint < 1440: Spalten proportional (`minmax`), gap 64 – Feinschliff in Phase 6.
- `index.astro`: Platzhalter `vision` durch die drei Komponenten ersetzt; die restlichen Anker bleiben Platzhalter.
- Abnahme: Build (3 Seiten) und Check grün, `npm run check:phase -- 2 index`: Lighthouse a11y **100/100** Desktop und Mobile, Screenshots in `docs/screens/phase-2-*`. Vision-/Mission-Positionen im Screenshot (1015 / 1760 / 2150) decken sich mit den Figma-Y-Werten (1016 / 1746 / 2139).
- Nachtrag `fix(phase-2)` (Commit `ea5ecfc`): Marquee-Outline-Einträge rendern jetzt hohl (`color: transparent`, 2 px Teal-Stroke, Bold) – das scoped `.marquee__item` hatte die globale `.outline-text`-Regel überstimmt. Abgleich mit Figma 139:59.

### Phase 3 – Warum K+ · 2026-09-09 · Commit `22243ed`

- Neu: `WarumKplus.astro` – Kopf (Eyebrow max. 163 px, H2, Slider-Label muted 16/26,4, `align-items: flex-end`), Karten-Track `<ul role="list" tabindex="0" aria-label>` mit `overflow-x: auto`, `scroll-snap-type: x mandatory`, `scroll-padding-inline-start: var(--gutter)`, Karten 636 px, gap 32, Trailing-Padding `calc(100% - gutter - 636px)`, damit auch die letzte Karte am Startrand einrastet. Fünf Feature-Karten (Icon 50 × 50 als inline SVG aus `public/icons/warum/` zur Buildzeit gelesen, `currentColor` = `--c-magenta`; gap 100; H3 `--fs-h3-card` teal; Text 18/28) + Statement-Karte (32/1,25 teal zentriert). Glow 384 px, `blur(32px)`, Gradient `--c-lime-a10` bei 50 % Opazität (Hover ×2 = 100 %), Hover-Rahmen `--c-teal-a30` nur bei `hover: hover`.
- Fortschrittslinie: Basis `--c-teal-a30`, Füllung **magenta** – Figma-Linie 139:188 ist #FF00FF, der Spec-Text „teal" war ein Extraktionsfehler (in DESIGN-SPEC.md korrigiert). Zähler 01/06 muted. Inline-Modul-Script (Astro-Bundle, kein GSAP) setzt `--progress` (kontinuierlich aus `scrollLeft`) und den Zähler (Karte, deren Start dem Snap-Rand am nächsten liegt); ohne JS 1/6 und 01/06.
- Mobile (< 768): Track als Grid, gap 12, Karten 342, padding 28, Icon 40, Abstände Icon → 20 → Titel → 20 → Text (Figma 242:87), Glow 230 px bei −40/−120, Slider-Label und Fortschritt ausgeblendet. Tablet (768–1023): Karten 480, padding 40, weiter scrollbar.
- `de.json`: `warumKplus.trackLabel` als `aria-label` des Tracks ergänzt. Tokens: `--c-teal-a30`, `--c-lime-a10`, `--fs-small`, `--lh-small`.
- Abnahme: Build/Check grün, `npm run check:phase -- 3 index` a11y **100/100**. Funktionstest mit neuem `scripts/browser-eval.mjs` (DevTools-Protokoll über Nodes WebSocket, kein Playwright): Desktop `scrollLeft` 0 → 01/06 · Karte 3 → 03/06 / Progress 0,5 · Ende → 06/06 / 1,0, kein horizontaler Body-Overflow; Mobile Grid 342 px, Icon 40, Fortschritt `display: none`.
- Nachtrag `fix(phase-3)`: Karten-Track startet oberhalb von 1920 px bündig mit dem zentrierten Container (`--track-start: max(gutter, (100% − container) / 2)` für Padding und `scroll-padding`); geprüft bei 2560 px (Kopf und erste Karte bei 473 px).
- Nachtrag `feat(phase-3)`: `partnership.svg` (zwei verschränkte Ringe) und `capital.svg` (Münze mit Euro-Zeichen) als selbst gezeichnete Stroke-Icons (`stroke-width` 1,4 = Linienbreite der Figma-Icons, 1,37 Einheiten), Strichstärke per 4×-Render und 2×-Screenshot neben `building.svg` verglichen. Damit keine Platzhalter mehr; Details in ASSETS.md.

### Phase 4 – Portfolio · 2026-09-09 · Commit `ab998f7`

- Neu: `Portfolio.astro` (Kopf max. 974 px, Logo-Wall `role="tablist"` 3×2 mit `<button role="tab">`-Tiles 240 px hoch, Spotlight-Panels `role="tabpanel"` – alle sechs gerendert, nur das aktive ohne `hidden`) und `src/scripts/portfolio.ts` (WAI-ARIA-Tabs: Klick, Pfeil links/rechts, Home, End mit Wrap, Roving-Tabindex, `focus({ preventScroll })`, `CustomEvent('portfolio:change')` für Phase 7). Ohne JS: erstes Spotlight sichtbar, Tiles inert.
- Logos: Teal-Maske per `mask: var(--logo) center/contain` mit `aspect-ratio` aus den Bildmaßen (`publicImageSize()` zur Buildzeit, keine Maße in `de.json`). `prepare-images.mjs` trimmt jetzt transparente Ränder (PLACE 554×106, VynciTech 692×167), sonst zählt die Maskenbox den Rand mit und die Marken wirken zu klein. **Kappes + Kemper** ist als Maske unbrauchbar (die K-Buchstaben sitzen im opaken Kasten → „▇ APPES EMPER") → wie im Figma unmaskiert (`mask: false`), SVG nachfordern; i-pro Kom ebenfalls unmaskiert.
- Aktiv-Zustand ohne Layout-Shift: 1 px Rahmen magenta + `inset 0 0 0 .5px` Schatten (= 1,5 px) + Glow `--c-magenta-a35`; Hover `translateY(-4px)`, Rahmen `--c-magenta-a50`. Spotlight `grid 680px 1px 1fr`, `min-height` 480, Textspalte Padding 31/56 und gap 24 (statt 56/28), damit auch das längste Panel exakt 480 px hoch bleibt und das Umschalten die Seite nicht verschiebt. „Webseite"-Button nur bei URL (derzeit Kappes Group), `target="_blank" rel="noopener"`.
- Mobile (< 768): Wall 2×3 mit Tiles 165×128 (Figma 165×128), Logos max. 118×36, Spotlight gestapelt mit Bild 200 px oben und horizontaler Accent-Line; Tablet 2 Spalten, Bild 280.
- Tokens: `--c-magenta-a90/-a50/-a35`, `--c-tile-bg-active`, `--c-white-a70`, `--c-night-a95/-a20`. `de.json`: `portfolio.wallLabel`.
- Abnahme: Build/Check grün. `browser-eval`: Klick → `aria-selected`/`hidden`/`tabindex` korrekt, ArrowRight/End/Wrap, vier `portfolio:change`-Events, Fokus folgt; alle Spotlights 480 px, kein Scroll-Versatz beim Umschalten; Mobile 2 Spalten, 165×128, Bild oben, kein Overflow. Lighthouse a11y Desktop **96**, Mobile **100** – einziger Abzug: „Webseite"-Button (`--c-magenta-text` #FF4DFF) auf dem teal-getönten Spotlight-Hintergrund = 4,08:1 (auf Night 4,84:1). Option: Token auf #FF66FF (4,5:1 auf der Tönung, 5,4:1 auf Night) – Entscheidung offen.
- Nachtrag `fix(phase-4)` (2026-09-09, Commit `da0ed44`): Spotlight unter 1024 px war auf die 200 px des Bildes abgeschnitten – durch `order: -1` am Bild rutschte die Textspalte in die feste 1-px-Grid-Zeile der Trennlinie, `overflow: hidden` klemmte Text, Chips und Button ab. Jetzt `height: auto` ohne feste Zeilen (Bild `order: -2`, Linie `order: -1` mit `height: 1px`). Geprüft per `browser-eval` (neue Option `--screenshot=<png>`) bei 390 px: Kappes Group 819 px hoch (Bild 200, Linie 1, Text 616), „Webseite"-Button vollständig im Panel; Place Strategy ohne Button 615 px; 768 px: 679 px mit Button; Desktop unverändert 480 px; kein horizontaler Overflow. Crops in `docs/screens/fix-4-spotlight-390-*.png`. Token `--c-magenta-text` auf `#FF66FF` (Night 5,36:1, Spotlight-Tönung 4,51:1, damit AA auch für den „Webseite"-Button), Abweichung 8 in DESIGN-SPEC.md aktualisiert.

### Phase 5 – Schwerpunkte · Founder · CTA · 2026-09-09 · Commit `4ef747d`

- Neu: `Schwerpunkte.astro` (Klassen `.focus*`), `Founder.astro`, `Cta.astro`; `index.astro` ohne Platzhalter in der Reihenfolge Hero → Vision → Mission → Marquee → WarumKplus → Portfolio → Schwerpunkte → Founder → Cta. Sektionsabstand weiterhin per `margin-top: var(--section-gap)` je Komponente wie in den Phasen 1–4 – die im Phasen-Doc genannte `.section`-Utility mit `padding-block` würde den Abstand zwischen zwei Sektionen verdoppeln und alle Bestandskomponenten anfassen.
- Schwerpunkte: `<Picture>` 1373 px breit zentriert (768/1373/2000, AVIF/WebP, lazy), vier Verläufe zu Night als ein Layer mit vier `linear-gradient`s (oben 445, unten 395, links/rechts 960 × 538 an den unteren Ecken, Stops 3,84 % / 13,45 % wie Figma 139:382–385), Overlay `--c-night-a60`. Kopf 850 zentriert bei 63, Spalten `repeat(2, minmax(0, 460px))` mit `space-between`, 52 px unter dem Kopf (Figma: Kopf 63–177, Items 229); `<h3>` 24 Bold lime, Text 18/28 teal, Items gap 50, je Liste `data-reveal-stagger`, Hintergrund `data-parallax`; `min-height` 832 (Figma-Frame). Unter 1024: eine Spalte linksbündig gap 24, Bild `cover`, Overlay `--c-night-a70`, ohne Seitenverläufe (zwei 960-px-Verläufe würden bei 390 das Foto decken), `padding-block` 72 (der Mobile-Frame hat 72 innen); unter 768 Kopf linksbündig (242:211).
- Kontrast Schwerpunkte (DoD): Hintergrund unter den Textspalten im 1920-Screenshot mit dekodiertem Foto gesampelt (Text ausgeblendet): hellster Pixel Luminanz 0,072 → teal 4,86:1, lime 7,33:1, Kopf 4,84:1 – über 4,5:1.
- Founder: Grid 713/827 gap 60 `align-items: center`, Porträt `aspect-ratio 713/515`, `object-position 50% 15%`; Text Eyebrow → 24 → Name (`.h2`) → 10 → Rolle lime → 24 → vier Absätze gap 16. Unter 1440 proportional (`minmax(0, 713fr)` / `827fr`), unter 1024 gestapelt mit Bild 342/247, Radius 8 (242:235) und `object-position 50% 20%`, unter 768 gap 28.
- CTA: Glow 775 px `radial-gradient(circle, --c-lime-a10, transparent 70%)`, blur 32, top −130, `data-glow`; Display `--fs-display-cta` Heavy, zweite Zeile `.outline-text` mit `--ls-outline` (10 px, Figma 139:465) und Überlappung `calc(size / -6)` (= −20 bei 120, −6 bei 36); Subline max. 1006 teal per `nl2br`; Buttons gap 16, Sekundär ohne Teal-Füllung (`:global(.cta__secondary)`, Hover weiß). Mobile: Glow 426 / −40 / blur 17,6 (242:248), Outline-Tracking `--ls-outline-mobile` 3 px, Buttons 342 × 46 gap 12.
- Spec-Korrektur: Mobile-CTA-Display **36 px** statt 46,8 – die 46,8 im Spec war die Zeilenhöhe (36 × 1,3; Figma 242:252); mit 46,8 px brach „Let's build beyond." bei 390 px um. Token `--fs-display-cta: clamp(36px, 14.588px + 5.4902vw, 120px)`, Typo-Tabelle und Abschnitt 9 angepasst.
- Tokens: `--ls-outline-hero` → `--ls-outline` (Hero und CTA), neu `--ls-outline-mobile`, `--c-night-a60`, `--c-night-a70`.
- Abnahme: Build (3 Seiten) und Check grün, keine Platzhalter, `grep "Build beyond" src/` trifft nur den Marquee-Kommentar. `browser-eval` 1920: Schwerpunkte 4519–5351 (832), Founder 5471–6110 (639), CTA 6230–6676 – gegenüber Figma (4509 / 5461 / 6219) konstant +10 px aus Phase 4; CTA 446 statt 516 hoch, weil das Display laut Spec Zeilenhöhe 1,0 hat (Figma: leading normal); Founder-Bild 713 × 515, CTA-Zeilen 120 px mit 20 px Überlappung, Buttons gap 16 transparent, eine `h1`, je Sektion eine `h2`, alle Bilder mit `alt`, kein horizontaler Overflow bei 1920/390. 390: Kopf links, sechs Items einspaltig, Porträt 342 × 247, Display 36 px einzeilig, Buttons 342 × 46. Lighthouse a11y Desktop **96**, Mobile **96** (`npm run check:phase -- 5 index`) – einziger Abzug weiterhin der „Webseite"-Button im Portfolio: axe rundet den getönten Hintergrund auf `#313F3F` und kommt mit `#FF66FF` auf 4,49:1 (rechnerisch 4,51); `#FF67FF` wäre der kleinste Wert, der auch bei axe 4,5:1 erreicht – Entscheidung offen. Screenshots: `docs/screens/phase-5-index-{desktop,mobile}.png` (Lighthouse – lazy geladene Fotos fehlen dort), `phase-5-schwerpunkte-1920.png`, `phase-5-founder-1920.png`, `phase-5-cta-390.png`.
- Gefunden, nicht Teil dieser Phase: bei 1024 px (mit Scrollbar 1009) läuft die Seite horizontal über – Verursacher ist allein die Portfolio-Wall (drei `1fr`-Spalten, Logos bis 314 px + Padding → Min-Content 1118 > Container 881). Für Phase 6 vormerken (z. B. `minmax(0, 1fr)` und `max-width: 100%` am Logo).
- Tooling: `browser-eval` mit `--timeout` (Watchdog) und `--screenshot-mode=viewport`. Full-Page-Captures hingen in Chrome, sobald große dekodierte AVIF-Fotos sichtbar waren (nach `scrollIntoView` oder mit Viewport in Seitenhöhe); Viewport-Captures nach `scrollTo` + `img.decode()` laufen zuverlässig.
