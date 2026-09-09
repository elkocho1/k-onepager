# Phase 4 – Portfolio (Logo-Wall + Spotlight)

**Ziel:** Logo-Wall 3×2 mit Aktiv-Zustand, Spotlight-Panel, das per Klick die Beteiligung wechselt. Funktioniert ohne JS (erstes Spotlight sichtbar), mit JS umschaltbar. Cross-Fade kommt in Phase 7.

**Input:** DESIGN-SPEC.md Abschnitt 6; Figma Node `227:2` (Tiles `227:9`–`227:14`, Spotlight `227:39`); Mobile `242:149`. Logos aus `public/logos/`, Texte/Tags/URLs aus `portfolio.companies`.

## Aufgaben

1. **`Portfolio.astro`** – `<section id="portfolio">`, Kopf (Breite 974: Eyebrow, `<h2>`, Intro), gap 56.
2. **Logo-Wall**: `<div class="wall" role="tablist" aria-label="Beteiligungen">`, Grid `repeat(3, 1fr)` gap 16. Je Firma ein `<button class="tile" role="tab" aria-selected aria-controls="spot-{slug}" id="tab-{slug}" data-slug>`. Inhalt: `.tile__logo` (Höhe 64, Breite `auto`, max 314; Teal-Maske: `background: var(--c-teal); mask: url(logo) center/contain no-repeat; -webkit-mask: …`; Breite über `aspect-ratio` aus den Logo-Maßen – dafür je Firma `logoWidth`/`logoHeight` in `de.json` ergänzen oder das Bild als unsichtbares `<img>` für die Größe rendern) + `.tile__name` (24 Medium weiß 70 %). Für i-pro Kom (kein transparentes Logo): `<img>` ohne Maske, Höhe 64 – über ein Feld `logoMask: false` in `de.json` steuern.
3. **Aktiv/Hover** laut Spec: `.tile[aria-selected="true"]` → Rahmen 1.5 px magenta, Glow, Name 100 %. Hover: translateY(−4), Rahmen magenta 50 %, 200 ms (`@media (hover: hover)`).
4. **Spotlight**: `<div class="spotlights">` mit sechs `<article class="spot" id="spot-{slug}" role="tabpanel" aria-labelledby="tab-{slug}" hidden>` – erste ohne `hidden`. Layout: 1600×480, radius 12, `grid-template-columns: 680px 1px 1fr`. Links Text (padding 56, gap 28): Logo teal (Höhe 64), `<p>` Text, Chips `<ul>` aus `tags`, `.btn--primary` „Webseite" nur wenn `url` nicht leer (`target="_blank" rel="noopener"`). Mitte Accent-Line (Gradient). Rechts `<Picture>` aus `src/assets/images/portfolio/{slug}.jpg` (480 hoch, cover, lazy) + Overlay-Gradient.
5. **Script** `src/scripts/portfolio.ts` (als `<script>` in der Komponente importiert): Klick auf Tile → alle Tiles `aria-selected=false`, Ziel `true`; alle `.spot` `hidden`, Ziel sichtbar. Tastatur: Pfeiltasten links/rechts wechseln Tab (WAI-ARIA Tabs Pattern), `Home`/`End`. Dispatch `CustomEvent('portfolio:change', {detail:{slug}})` für Phase 7. Kein Scroll-Sprung beim Wechsel.
6. **Mobile (< 768)**: Wall `repeat(2, 1fr)` gap 12, Tile 128 hoch, Logo max 118×36, Name 15.5. Spotlight: Grid einspaltig – Bild 200 hoch oben, Accent-Line horizontal 1 px, Text padding 28/24, Chips umbrechend, Button Breite auto.
7. **Tablet (768–1023)**: Wall 2 Spalten, Spotlight einspaltig wie Mobile, Bild 280 hoch.
8. `index.astro`: Platzhalter ersetzen.

## Definition of Done

- [ ] 3×2 Wall, Tiles 522×240 bei 1920, Logos teal einfarbig (i-pro Kom farbig, dokumentiert), Kappes Group initial aktiv mit Magenta-Rahmen und Glow
- [ ] Spotlight zeigt Logo, Text, Chips, Button nur bei URL (aktuell nur Kappes Group)
- [ ] Klick/Enter/Pfeiltasten wechseln Tile + Spotlight, `aria-selected` und `hidden` korrekt
- [ ] Ohne JS: erstes Spotlight sichtbar, Tiles ohne Funktion, aber kein Fehler
- [ ] Mobile 390: 2×3 Wall, Spotlight gestapelt mit Bild oben
- [ ] Commit `feat(phase-4): portfolio wall + spotlight`
