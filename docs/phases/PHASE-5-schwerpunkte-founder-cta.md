# Phase 5 – Schwerpunkte, Founder, CTA

**Ziel:** Die drei letzten Sektionen vor dem Footer stehen statisch. Danach ist der Onepager inhaltlich komplett.

**Input:** DESIGN-SPEC.md Abschnitte 7–9; Figma Nodes `139:379`, `139:411`, `139:457`; Mobile `242:203`, `242:234`, `242:247`.

## Aufgaben

### Schwerpunkte

1. **`Schwerpunkte.astro`** – `<section id="schwerpunkte">`, Höhe auto (Desktop ca. 832), `position: relative; overflow: hidden`.
2. Hintergrund: `<Picture>` `schwerpunkte.jpg` absolut, zentriert, Breite 1373 (Desktop) bzw. cover, `object-fit: cover`, `data-parallax` (Phase 7). Darüber `.bg-fade` mit vier Verläufen (oben 445, unten 395, links/rechts 960 – als `background-image` mit vier `linear-gradient`s auf einem Layer) und `.bg-dim` night 60 %.
3. Kopf zentriert (Breite 850, `margin-top` 63): `.eyebrow` zentriert, `<h2>` zentriert.
4. Items: `.container` Grid `460px 1fr 460px` (Mitte leer, `space-between`), `margin-top` ~110. Linke `<ul>` Items 1–3 mit `border-left` lime, rechte `<ul>` Items 4–6 mit `border-right` lime, `text-align: right`, `padding-right: 16`. Item: `<h3>` 24 Bold lime, `<p>` 18/28 teal, gap 14, Items gap 50. `data-reveal-stagger`.
5. Mobile: eine Liste, alle 6 Items linksbündig, gap 24, Bild als Hintergrund mit Overlay 70 %.

### Founder

6. **`Founder.astro`** – `<section id="founder">`, `.container` Grid `713px 827px` gap 60, `align-items: center`. Bild `<Picture>` `founder-alexander-kappes.jpg` 713×515, `object-fit: cover; object-position: 50% 15%`. Text: Eyebrow, `<h2>` Name (42 teal), Rolle (18/28 lime, gap 10), vier Absätze (gap 16). Mobile: Bild 342×247 oben, `object-position: 50% 20%`.

### CTA

7. **`Cta.astro`** – `<section id="kontakt">`, zentriert, `position: relative; overflow: hidden`, Glow-Kreis `.cta__glow` (775 px, blur 32, `radial-gradient(circle, rgba(204,255,0,.10), transparent 70%)`, `data-glow` für Phase 7). Eyebrow, `<h2 class="display">` mit zwei Zeilen aus `cta.headline` (zweite `.outline-text` lime), Subline 18/28 teal zentriert Breite 1006 mit `nl2br`, Buttons gap 16 (Primär mailto Pitch, Sekundär mailto Kontakt – ohne Teal-Füllung).
8. Mobile: Display `clamp()` bis 46.8 px, Buttons volle Breite untereinander.
9. `index.astro`: alle Platzhalter ersetzt; Reihenfolge Hero → Vision → Mission → Marquee → WarumKplus → Portfolio → Schwerpunkte → Founder → Cta. Section-Gap 120 (Mobile 72) konsistent über eine Utility-Klasse `.section` mit `padding-block`.

## Definition of Done

- [x] Schwerpunkte: Bild nur in der Mitte sichtbar, sechs Items 3 links / 3 rechts mit lime-Linien, Text lesbar (Kontrast ≥ 4.5:1 auf dem gedimmten Bild)
- [x] Founder: Porträt 713×515 links, vier Absätze rechts, Name 42 teal, Rolle lime
- [x] CTA: Display zweizeilig mit Outline „Together.", Glow, zwei mailto-Buttons
- [x] Gesamtseite bei 1920 entspricht dem Figma-Frame in Reihenfolge und Abständen (Screenshot-Vergleich `docs/screens/phase-5-desktop.png` gegen Figma)
- [x] Keine Platzhalter-Sektionen mehr in `index.astro`
- [x] Commit `feat(phase-5): schwerpunkte, founder, cta`
