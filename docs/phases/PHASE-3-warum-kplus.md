# Phase 3 – Warum K+ (Karten-Slider)

**Ziel:** Sektion „Warum K+" mit sechs Karten als horizontal scrollbare Reihe (Desktop) bzw. Stapel (Mobile), Fortschrittslinie und Zähler. Noch keine GSAP-Animation – Scrollen per nativem `overflow-x` + `scroll-snap`.

**Input:** DESIGN-SPEC.md Abschnitt 5; Figma Node `139:72` (Karten `139:82`, `139:94`, `75:497`, `75:512`, `75:524`, Statement `166:2`, Fortschritt `139:185`); Mobile `242:81`. Icons aus `public/icons/warum/`.

## Aufgaben

1. **`WarumKplus.astro`** – `<section id="warum-kplus">`. Kopf im `.container`: links Eyebrow (Breite 163, `white-space: normal`) + `<h2>`, rechts `sliderLabel` (`--c-muted`, 16/26.4), `align-items: flex-end`.
2. **Karten-Track**: `<ul class="cards" data-cards>` als `display: flex; gap: 32px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; padding-inline-start: var(--gutter)` – der Track läuft rechts aus dem Viewport (Figma-Breite 1760 ab x 160). Jede `<li class="card">` 636 px breit, `flex: 0 0 auto`, `scroll-snap-align: start`.
3. **Feature-Karte** (`cards[]`): Hülle `--c-card-bg`, 1 px night, padding 50, `position: relative; overflow: hidden`. Innen: Icon-Slot 50×50 (SVG inline über `Fragment set:html` aus `public/icons/warum/{icon}.svg` gelesen zur Buildzeit – oder `<img>` mit CSS-Mask, Farbe magenta), gap 100, `<h3>` 42 KMR Regular teal tracking 0.96, gap 14, `<p>` 18/28 weiß. Glow als `.card__glow` absolut (384 px, blur 32, Gradient aus Spec).
4. **Statement-Karte**: gleiche Hülle, Inhalt vertikal/horizontal zentriert, `<p>` 32/1.25 teal zentriert, Mindesthöhe wie die anderen Karten (Grid `align-items: stretch`).
5. **Fortschrittslinie**: unter dem Track (gap 40) im `.container`: `<div class="progress" aria-hidden="true">` 1540 breit, 1 px Basis `rgba(126,209,201,.3)`, `.progress__bar` teal mit `transform: scaleX(1/6)`; rechts daneben `<span class="progress__count">01/06</span>`. Ein kleines Inline-Script (kein GSAP) aktualisiert `scaleX` und Zähler aus `scrollLeft` des Tracks (`IntersectionObserver` je Karte reicht). Ohne JS: Linie steht auf 1/6, Zähler 01/06.
6. **Mobile (< 768)**: Track wird `display: grid; gap: 12px` ohne Scroll, Karte volle Breite, padding 28, Icon 40, h3 30, Text 18/28, Glow 230 px bei −40/−120. Fortschrittslinie und Zähler `display: none`.
7. **Tablet (768–1023)**: Track scrollbar bleibt, Karten 480 px breit, padding 40.
8. **Hover** (nur `@media (hover: hover)`): Karte `border-color: rgba(126,209,201,.3)`, Glow-Opazität ×2, 200 ms.
9. `index.astro`: Platzhalter ersetzen.

## Definition of Done

- [x] Sechs Karten in einer Reihe, horizontal scrollbar per Maus/Trackpad/Touch, Snap auf Kartenanfang
- [x] Erste Karte beginnt bei 160 px, Reihe läuft rechts aus, kein Body-Scrollbalken
- [x] Icons magenta 50×50 (mind. Platzhalter), Titel teal 42, Glow sichtbar oben links jeder Karte
- [x] Fortschrittslinie und Zähler folgen dem Scroll
- [x] Mobile: Stapel, kein Zähler
- [x] Tastatur: Track per Tab erreichbar (`tabindex="0"`, `aria-label`), Pfeiltasten scrollen (nativ durch overflow)
- [x] Commit `feat(phase-3): warum k+ cards`
