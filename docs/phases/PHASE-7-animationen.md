# Phase 7 – Animationen

**Ziel:** Alle 15 Animationen aus `PROJEKT-STRUKTUR.md` sind eingebaut, laufen flüssig (60 fps auf einem MacBook Air / Mittelklasse-Android), und die Seite bleibt ohne JS und bei `prefers-reduced-motion` vollständig nutzbar. Referenz für die Anmutung: getminds.ai, amp.framer.media, kudos.framer.media (flüssig, zurückhaltend, kein Effekt-Feuerwerk).

**Input:** Animationsliste in `PROJEKT-STRUKTUR.md`, `data-*`-Hooks aus Phase 1–5, Referenzvideos des Kunden (Hero-Typo, Beteiligungs-Sequenz – Michael fragen, falls nicht im Ordner).

## Grundregeln

- Ein Einstiegspunkt `src/scripts/animations.ts`, im `Base.astro` als `<script>` eingebunden (Astro bündelt, `type="module"`). Früher Return, wenn `matchMedia('(prefers-reduced-motion: reduce)').matches`.
- GSAP + ScrollTrigger registrieren, Lenis initialisieren und mit `ScrollTrigger.update` über `lenis.on('scroll', …)` + `gsap.ticker` koppeln. Anker-Links über `lenis.scrollTo(hash, { offset: -96 })`.
- Alle Startzustände (opacity 0, translateY) **nur per JS setzen** (`gsap.set`), nie im CSS – sonst ist die Seite ohne JS leer. Ausnahme: `.is-scrolled` an der Nav ist reines CSS.
- Nur `transform` und `opacity` animieren. Keine Layout-Properties.
- Alles in `ScrollTrigger.matchMedia` / `gsap.matchMedia()` kapseln: Desktop `(min-width: 1024px)`, Mobile darunter (reduzierte Varianten).

## Aufgaben (Nummern = Animationsliste)

1. **Hero-Typo „Build Beyond."** – scroll-getrieben (Scrub 0.6): Beim Laden Zeilen von unten einblenden (Buchstaben-Stagger 0.03 s, `SplitText`-Ersatz: Buchstaben zur Buildzeit in `<span>` splitten in `Hero.astro`), beim Scrollen Outline-Zeile „Beyond." leicht nach rechts driften (tracking-Effekt: `letter-spacing` via `x`-Stagger je Buchstabe) und Textblock mit `y: -80, opacity: 0` bis Hero-Ende ausblenden. Details nach Referenzvideo abstimmen.
2. **Hero Bild-Parallax** – Bild `scale: 1.1 → 1`, `y: 0 → 120` über die Hero-Höhe, scrub.
3. **Nav** – ab 40 px Scroll `.is-scrolled` (Hintergrund + Blur + top 0), CSS-Transition 300 ms. Aktiver Nav-Link per ScrollTrigger je Sektion (`aria-current="true"`).
4. **Section-Reveal** – alle `[data-reveal]`: `y: 24, opacity: 0 → 0, 1`, 0.8 s, `--ease-out`, `start: 'top 85%'`, `once: true`. `IntersectionObserver`-Fallback nicht nötig, ScrollTrigger übernimmt.
5. **Mission-Prinzipien** – `[data-reveal-stagger] > *` stagger 0.12.
6. **Marquee** – zwei Zeilen endlos gegenläufig (`xPercent: -50` auf dem doppelten Track, `repeat: -1`, Dauer 40 s / 32 s, `ease: none`), Geschwindigkeit leicht scroll-abhängig (Velocity-Boost ×1.5 beim Scrollen, `ScrollTrigger` `onUpdate` + `timeScale`). Pause bei `document.hidden`.
7. **Warum-K+-Slider** – Desktop: nativer Scroll bleibt, zusätzlich Fortschrittslinie per `scaleX` animiert (GSAP `quickTo`), Karten beim Eintritt stagger-reveal. Option (nach Sichtung): horizontales Pinning der Sektion, bei dem vertikales Scrollen die Karten schiebt (`pin: true, scrub: 1, end: '+=' + track.scrollWidth`) – nur wenn es sich in der Referenz gut anfühlt, sonst nativ lassen. Mobile: nur Stagger.
8. **Karten-Glow Hover** – Glow-Opacity 1 → 2 und leichte Bewegung zum Cursor (`quickTo` x/y, nur `hover: hover`).
9. **Portfolio Logo-Wall** – Tiles stagger 0.08 beim Eintritt; Hover-Lift ist CSS; Aktiv-Rahmen/Glow wechselt mit 300 ms Transition.
10. **Portfolio Spotlight-Wechsel** – auf `portfolio:change`: altes Panel `opacity 1 → 0` (0.25 s), neues Panel `opacity 0 → 1` + Bild `scale 1.05 → 1` (0.6 s), Textspalte `x: 24 → 0` stagger 0.06. `hidden` erst nach dem Fade setzen (Höhe stabil halten: `.spotlights { display: grid }` mit allen Panels in `grid-area: 1/1`).
11. **Schwerpunkte** – Bild-Parallax `y: -60 → 60` scrub, Items stagger-reveal links/rechts (`x: -24` bzw. `x: 24`).
12. **CTA-Glow** – `[data-glow]` langsam pulsierend (`scale 1 → 1.12, opacity .8 → 1`, 6 s, yoyo, `repeat: -1`), plus leichtes Mitwandern mit dem Scroll.
13. **Button-Hover** – CSS 200 ms (Phase 1 bereits), zusätzlich `:active` scale .98.
14. **Smooth Scroll** – Lenis (`lerp: 0.1`, `wheelMultiplier: 1`), auf Touch deaktiviert (`syncTouch: false`). Anker-Links, `scroll-padding` beachten.
15. **Hex-Cursor** – `src/scripts/hex-cursor.ts` + `HexCursor.astro`: `<canvas>` fixed über der ganzen Seite, `pointer-events: none`, `z-index` unter der Nav. Hexagon-Raster (Kantenlänge 28 px, 1 px Linien magenta) wird nur im Radius 220 px um den Cursor sichtbar (radialer Alpha-Verlauf, `globalCompositeOperation`), Cursor-Position mit `lerp 0.15` nachgezogen. Nur bei `(pointer: fine)` und nicht bei reduced-motion; auf `resize` Raster neu berechnen; `requestAnimationFrame` nur laufen lassen, wenn sich die Maus in den letzten 2 s bewegt hat. Über dunklen Flächen ist das Raster sichtbar, über Bildern (Hero, Schwerpunkte) mit `mix-blend-mode: screen` dezenter.

## Definition of Done

- [ ] Alle 15 Punkte umgesetzt, Verhalten je Punkt kurz in `docs/BUILD-PHASES.md` Status-Log notiert
- [ ] `prefers-reduced-motion: reduce`: keine Bewegung, alle Inhalte sofort sichtbar, Marquee statisch, kein Canvas
- [ ] JS deaktiviert: Seite komplett sichtbar (kein `opacity: 0` im CSS)
- [ ] Chrome Performance-Aufnahme beim Durchscrollen: keine Long Tasks > 50 ms, keine Layout-Shifts
- [ ] Mobile (echtes Gerät oder Emulation): Scroll flüssig, kein Lenis-Ruckeln auf Touch
- [ ] Bundle-Größe JS gzip ≤ 90 kB (GSAP + ScrollTrigger + Lenis ≈ 45 kB)
- [ ] Commit `feat(phase-7): animations, smooth scroll, hex cursor`
