# Phase 6 – Responsive-Feinschliff

**Ziel:** Alle Sektionen entsprechen bei 390 px dem Mobile-Frame `242:21` 1:1 und sehen bei 768, 1024, 1440 und 1920 sauber aus. Keine horizontalen Scrollbalken, keine abgeschnittenen Texte, Touch-Ziele ≥ 44 px.

**Input:** DESIGN-SPEC.md „Breakpoints" + Mobile-Angaben je Sektion; Figma Mobile-Frame `242:21` (Sektionen `242:22` Hero, `242:46` Vision, `242:55` Mission, `242:70` Marquee, `242:81` Warum K+, `242:149` Portfolio, `242:203` Schwerpunkte, `242:234` Founder, `242:247` CTA, `242:260` Footer). Bei Detailfragen `get_design_context` auf die jeweilige Node.

## Aufgaben

1. **Mobile 390** Sektion für Sektion gegen den Figma-Frame prüfen (Screenshot-Vergleich): Abstände (Padding 24, Sektionsabstand 72), Schriftgrößen (Display 78, H2 34, H3 30/22, Body 18/28), Button-Höhen 46, Bildhöhen (Hero 780, Vision 260, Portfolio-Spot 200, Founder 247).
2. **Fluid Type** final: `--fs-display: clamp(78px, 6.25vw, 120px)`, `--fs-h2: clamp(34px, 2.2vw, 42px)`, `--fs-h3-card: clamp(30px, 2.2vw, 42px)`, Body bleibt 18/28 (unter 360 px 16/26).
3. **1024–1439**: Gutter 64, Zweispalter mit `minmax(0, 1fr)` statt fixer Pixelbreiten, Warum-K+-Karten 560 breit, Portfolio-Spotlight Textspalte 45 %, Schwerpunkte-Spalten 40 %/40 %.
4. **768–1023**: Zweispalter stapeln (Vision, Mission, Founder, Spotlight), Logo-Wall 2 Spalten, Schwerpunkte einspaltig, Nav-Links ausblenden wie Mobile (Entscheidung Burger-Menü offen).
5. **Landscape-Mobile / kleine Höhen**: Hero `min-height: 100svh` mit `max-height: 936px`; Textblock darf nicht abgeschnitten werden (`padding-block` statt fester Top-Position).
6. **Große Screens (≥ 2560)**: Container bleibt 1600, Hintergrundbilder cover, Marquee-Fades 522 fix – prüfen, dass nichts zu leer wirkt (ggf. Hero-Bild `max-height: 1100px`).
7. **Touch/A11y**: Tiles und Buttons ≥ 44 px hoch, Fokus-Ringe sichtbar (`outline: 2px solid var(--c-lime); outline-offset: 3px`), `:focus-visible` überall.
8. **Bilder**: `sizes`-Attribute je Breakpoint korrekt (Hero 100vw, Vision `(min-width:1024px) 778px, 100vw`, Founder `(min-width:1024px) 713px, 100vw`, Portfolio `(min-width:1024px) 920px, 100vw`).
9. Playwright-Screenshots aller Breakpoints nach `docs/screens/phase-6-{390,768,1024,1440,1920}.png`.

## Definition of Done

- [x] 390 px: jede Sektion deckt sich mit dem Mobile-Frame (Toleranz ±8 px bei Höhen) – strukturell (Abstände, Bildhöhen, Buttons); die Sektionshöhen liegen wegen der Spec-Typografie (Body 18/28 statt Inter 15/23 im Frame) darüber, siehe Status-Log
- [x] Kein `document.documentElement.scrollWidth > innerWidth` bei 320, 390, 768, 1024, 1440, 1920 (und 2560)
- [x] Alle interaktiven Elemente per Tastatur erreichbar, Fokus sichtbar
- [x] Lighthouse Mobile: Accessibility ≥ 95, Best Practices ≥ 95, CLS < 0.05
- [x] Commit `feat(phase-6): responsive pass`
