# K+ Onepager – Anweisungen für Claude Code

Statischer Onepager für die Kplus GmbH (Stuttgart, Claim „Build beyond."). Astro, kein CMS, Hosting IONOS.
Der Build läuft in **Phasen** – siehe `docs/BUILD-PHASES.md`. Immer nur die aktuelle Phase bearbeiten, am Ende der Phase die Definition of Done abhaken und den Status in `docs/BUILD-PHASES.md` fortschreiben.

## Quellen der Wahrheit (in dieser Reihenfolge)

1. `content/de.json` – **alle** Texte, Links, Bildpfade. Nie Text hart in Komponenten schreiben.
2. `docs/DESIGN-SPEC.md` – Maße, Farben, Typo, Layout je Sektion (aus dem Figma-Design extrahiert).
3. Figma-Datei „K+ Design" – Desktop-Frame `139:2`, Mobile-Frame `242:21`
   (https://www.figma.com/design/syfwfhy6jqTLCFVeFt8D2F/K--Design?node-id=139-2). Bei Unklarheit im Spec dort nachsehen (Figma MCP: `get_design_context` auf die Node-ID aus dem Spec).
4. `docs/ASSETS.md` – welches Material aus `_material/` wohin nach `public/` kommt.
5. `PROJEKT-STRUKTUR.md` – Grundsatzentscheidungen, offene Punkte vom Kunden.

## Stack (fest)

- Astro (neueste 5.x), `output: 'static'`, TypeScript strict
- CSS: eigene Stylesheets (`src/styles/tokens.css`, `global.css`) + scoped `<style>` in Komponenten. **Kein Tailwind, kein CSS-Framework.**
- Animationen: `gsap` + `ScrollTrigger`, `lenis` (Smooth Scroll). Erst ab Phase 7 einbauen.
- Bilder: `astro:assets` (`<Image>` / `<Picture>`), Quelle in `src/assets/images/`, Ausgabe WebP/AVIF
- Integrationen: `@astrojs/sitemap`
- Package Manager: npm. Node 22.

## Regeln

- Nach jeder Phase (und vor jedem Commit): `npm run build` muss fehlerfrei durchlaufen, `npm run preview` kurz prüfen.
- Ohne JavaScript muss die komplette Seite lesbar und navigierbar sein. JS legt nur Animationen/Interaktion obendrauf.
- Eine `<h1>` (Hero), pro Sektion genau eine `<h2>`. Semantisches HTML (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`).
- Jede Sektion hat `id` aus `de.json` (`vision`, `warum-kplus`, `portfolio`, `schwerpunkte`, `founder`, `kontakt`).
- Fonts selbst gehostet aus `public/fonts/`, `font-display: swap`, Preload nur für Regular + Medium.
- `prefers-reduced-motion: reduce` → alle Scroll-Animationen, Marquee und Hex-Cursor aus, Inhalte sofort sichtbar.
- Keine externen Requests (keine Google Fonts, kein Analytics, keine CDNs) – damit bleibt die Seite ohne Cookie-Banner.
- Farbwerte, Schriftgrößen, Abstände nur über die Tokens aus `tokens.css`. Keine Magic Numbers in Komponenten, außer sie stehen so im Spec.
- Deutsche Sprache im UI, Code/Kommentare auf Englisch, Commit-Messages auf Englisch (`feat: hero section`, `chore: phase 0 setup`).
- `_material/` ist Rohmaterial und steht in `.gitignore`. Nur aufbereitete Assets landen in `public/` bzw. `src/assets/`.
- Nichts aus dem Spec „verbessern" oder umgestalten. Abweichungen vom Figma nur, wenn `docs/DESIGN-SPEC.md` sie ausdrücklich nennt (Abschnitt „Bewusste Abweichungen").

## Befehle

```
npm install
npm run dev        # http://localhost:4321
npm run build      # -> dist/
npm run preview
```

## Ordnerstruktur (Ziel)

```
content/de.json
public/fonts/  public/logos/  public/og/  robots.txt  favicon.svg
src/assets/images/            # Quellbilder für astro:assets
src/layouts/Base.astro
src/components/{Nav,Hero,Vision,Mission,Marquee,WarumKplus,Portfolio,Schwerpunkte,Founder,Cta,Footer,HexCursor}.astro
src/scripts/{animations,hex-cursor,portfolio}.ts
src/styles/{tokens,global}.css
src/pages/{index,impressum,datenschutz}.astro
src/lib/content.ts             # typisierter Loader für de.json
docs/                          # Spec + Phasen (nicht deployen)
_material/                     # Rohmaterial (gitignored)
```
