# Phase 2 – Vision, Mission, Marquee

**Ziel:** Die drei Sektionen direkt unter dem Hero stehen statisch – Desktop-Layout 1:1, Mobile gestapelt.

**Input:** DESIGN-SPEC.md Abschnitte 2–4; Figma Nodes `139:45` (Vision), `144:2` (Mission), `139:59` (Marquee); Mobile `242:46`, `242:55`, `242:70`.

## Aufgaben

1. **`Vision.astro`** – `<section id="vision">` (aus `vision.id`), `.container`, Grid 2 Spalten `778px 702px` mit gap 120, `align-items: center`. Bild `<Picture>` `vision.jpg` (778×650, `object-fit: cover; object-position: 60% 50%`, lazy). Text: `.eyebrow`, `<h2>`, Absätze aus `vision.paragraphs`. Mobile: `grid-template-columns: 1fr`, Bild 342×260 zuerst.
2. **`Mission.astro`** – kein eigenes `id` (Teil von „Warum K+"-Kontext, folgt 80 px unter Vision). Grid `702px 778px` gap 203 (bei < 1440 auf `1fr 1fr` gap 64). Links Eyebrow/H2/Body, rechts `<ul class="principles">` mit drei `<li>`: `strong` (24 Bold lime) + `span` (18/28 teal), `border-left: 1px solid var(--c-lime)`, padding-left 16, gap 50 (Mobile 24). `data-reveal-stagger` an der Liste (Phase 7).
3. **`Marquee.astro`** – `<div class="marquee" aria-hidden="true">` (dekorativ; Screenreader bekommen die Begriffe nicht – sie stehen sinngemäß nirgends sonst, das ist ok). Zwei `.marquee__row` mit den Einträgen aus `marquee.rows`; jeder Eintrag als `<span>`, abwechselnd `.outline-text` (Zeile 1 beginnt mit Outline, Zeile 2 mit Regular). Für die spätere Endlos-Animation jede Zeile **zweimal** hintereinander rendern (`.marquee__track` mit 2× Inhalt). Statisch: Zeile 1 `justify-content: flex-end`, Zeile 2 `flex-start`, `overflow: hidden`, Fade-Masken links/rechts 522 px via `mask-image: linear-gradient(90deg, transparent, #000 522px, #000 calc(100% - 522px), transparent)` (Mobile 60 px). Höhe 122 Desktop / 90 Mobile, Text 42 / 33.
4. **`index.astro`**: Platzhalter `vision` durch `<Vision /><Mission /><Marquee />` ersetzen; Abstand Vision→Mission 80 px, Mission→Marquee 80 px, danach Section-Gap.

## Definition of Done

- [x] Vision bei 1920: Bild 778×650 links, Text 702 rechts, Eyebrow magenta, H2 42 teal
- [x] Mission: drei Prinzipien mit lime-Linie links, Titel lime 24, Subtext teal
- [x] Marquee zeigt zwei Zeilen, jeder zweite Eintrag als Outline, Ränder laufen in night aus, kein horizontaler Scrollbalken (`body { overflow-x: hidden }` greift, aber die Sektion selbst hat `overflow: hidden`)
- [x] Mobile 390: Bild über Text, Prinzipien gestapelt, Marquee 33 px
- [x] Alle Texte aus `de.json`
- [x] Commit `feat(phase-2): vision, mission, marquee`
