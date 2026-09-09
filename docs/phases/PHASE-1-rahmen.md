# Phase 1 – Rahmen: Nav, Hero, Footer, Rechtsseiten

**Ziel:** Die Seite hat Kopf, Hero und Fuß. Anker-Navigation funktioniert (Ziel-Sektionen dürfen noch leere `<section id>`-Platzhalter sein). Impressum und Datenschutz existieren als Seiten.

**Input:** DESIGN-SPEC.md Abschnitte 0 (Nav), 1 (Hero), 10 (Footer); Figma Nodes `139:32`, `139:14`, `139:469`, Mobile `242:27`, `242:22`, `242:260`.

## Aufgaben

1. **`Nav.astro`** – `<header>` fixed, `.container`, Logo-Link auf `/` (SVG `kplus.svg`, `width/height` gesetzt, `alt` aus `nav.logoAlt`), `<nav aria-label="Hauptnavigation">` mit den drei Links aus `nav.items`, rechts `.btn--primary` mit `nav.cta`. Attribut `data-nav` für Phase 7. Mobile (< 768): nur Logo, Links und Button `display: none` (siehe Abweichung 7 im Spec – bis zur Entscheidung so lassen). Transparent; Scroll-Zustand kommt in Phase 7, aber die Klasse `.is-scrolled` mit Hintergrund/Blur bereits in CSS anlegen.
2. **`Hero.astro`** – `<section class="hero">` volle Viewport-Breite, Höhe `min(936px, 100svh)` Desktop, 780 Mobile. `<Picture>` aus `src/assets/images/hero.jpg` (`loading="eager"`, `fetchpriority="high"`, `widths=[768,1280,1920,2560]`, `sizes="100vw"`), Verläufe als zwei absolute `::before/::after`-Layer laut Spec. Textblock: Eyebrow, `<h1>` mit zwei `<span class="line">` (zweite `.outline-text`), Body mit `nl2br`, Button-Reihe. Headline-Zeilen bekommen `data-hero-line` (Phase 7).
3. **`Footer.astro`** – laut Spec 10, `<footer>`, Logo, Claim, Linie, Stadt/Adresse (als `<address>`), untere Leiste mit Copyright und Links aus `footer.links`.
4. **`Base.astro`** ergänzen: `<Nav />` vor `<main>`, `<Footer />` danach, `scroll-padding-top: 96px` am `html` für Anker.
5. **`index.astro`**: Hero einbinden, darunter leere Platzhalter-Sektionen mit den `id`s `vision`, `warum-kplus`, `portfolio`, `schwerpunkte`, `founder`, `kontakt` (je 400 px hoch, Kommentar `<!-- Phase N -->`), damit Anker testbar sind.
6. **Rechtsseiten** `impressum.astro`, `datenschutz.astro`: Base-Layout, `.container` mit `max-width: 820px`, `<h1>` + Platzhaltertext „Inhalt folgt vom Kunden", `noindex` per Prop bis der Text da ist. Typo: h1 42 teal, h2 24 lime, Body 18/28 weiß, Links teal unterstrichen. Zurück-Link zur Startseite.
7. **Button-Komponente** optional als `Button.astro` (Props `href`, `variant`, `label`), wenn es die Wiederverwendung in Hero/CTA/Portfolio/Nav vereinfacht.

## Definition of Done

- [x] Nav fixed und transparent auf dem Hero, drei Links + Button, Logo verlinkt auf `/`
- [x] Hero entspricht Spec bei 1920 (Textblock 809 breit ab 160 px, Display 120 px, Outline-Zeile lime) und bei 390 (Buttons volle Breite untereinander)
- [x] Hero-Bild als `<picture>` mit AVIF/WebP-Quellen im Build, `width`/`height` gesetzt, kein CLS
- [x] Footer laut Spec, Links auf `/impressum` und `/datenschutz` funktionieren
- [x] Klick auf Nav-Links springt zu den Platzhalter-Sektionen (Anker-Offset stimmt)
- [x] Ohne JS vollständig nutzbar
- [x] Lighthouse (Preview, Desktop) Accessibility ≥ 95 für index
- [x] Commit `feat(phase-1): nav, hero, footer, legal pages`
