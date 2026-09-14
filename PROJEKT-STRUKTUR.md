# K+ Onepager – Projektstruktur (Astro, statisch, IONOS)

## Projekt
- **Repo**: https://github.com/elkocho1/k-onepager (privat)
- **Lokaler Ordner**: `C:\Users\Michael\Desktop\K+ Onepager Main`
- **Figma**: Desktop-Frame Node 139:2, Mobile-Frame Node 242:21 (Datei „K+ Design")
- **Material**: liegt lokal in `_material/` (nicht ins Repo, gitignored)

## Entscheidungen
- Kein CMS, alle Texte in `content/de.json`
- Navigation wie im Figma: Warum K+ · Unsere Beteiligungen · Unsere Schwerpunkte · Button „Kontakt aufnehmen"
- „Pitch einreichen" und „Kontakt aufnehmen" als Mailto-Links (Adresse folgt)
- Kein Analytics, damit kein Cookie-Banner
- Portfolio ohne die Zusätze „Build beyond. Strategy/Architecture/…" (Kundenfeedback: alle Beteiligungen gleichwertig)
- Impressum/Datenschutz als eigene Seiten

## Stack
- **Astro** (statischer Build, `output: 'static'`)
- **Content**: `content/de.json` – alle Texte, Links, Bildpfade
- **Animationen**: GSAP + ScrollTrigger (Hero-Typo, Marquee, Slider, Portfolio-Wechsel), Lenis (Smooth Scroll), Rest CSS + IntersectionObserver
- **Hosting**: IONOS Webspace, Deploy per GitHub Action (SFTP/rsync von `dist/`)

## Ordner
```
kplus-onepager/
├── content/
│   └── de.json                 # gesamter Textcontent
├── public/
│   ├── fonts/                  # KMR Apparat Regular/Medium als .woff2
│   ├── logos/                  # SVG-Logos der Beteiligungen (einfarbig, transparent)
│   ├── images/                 # Fotos (Hero, Vision, Founder, Schwerpunkte, portfolio/*)
│   ├── og/                     # OG-Bild 1200x630
│   ├── robots.txt
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   └── Base.astro          # <head> mit Meta/OG/JSON-LD, Fonts, Nav, Footer, Hex-Canvas
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Hero.astro
│   │   ├── Vision.astro
│   │   ├── Mission.astro
│   │   ├── Marquee.astro
│   │   ├── WarumKplus.astro    # Slider Desktop / Stack Mobile
│   │   ├── Portfolio.astro     # Logo-Wall + Spotlight
│   │   ├── Schwerpunkte.astro
│   │   ├── Founder.astro
│   │   ├── Cta.astro
│   │   ├── Footer.astro
│   │   └── HexCursor.astro     # Canvas-Layer für den Cursor-Spotlight
│   ├── scripts/
│   │   ├── animations.ts       # GSAP/ScrollTrigger-Setups, reduced-motion-Check
│   │   ├── hex-cursor.ts
│   │   └── portfolio.ts        # Kachel-Klick → Spotlight-Wechsel
│   ├── styles/
│   │   ├── tokens.css          # Farben, Schrift, Abstände (aus dem Designmanual)
│   │   └── global.css
│   └── pages/
│       ├── index.astro         # Onepager
│       ├── impressum.astro
│       └── datenschutz.astro
├── .github/workflows/deploy.yml
├── astro.config.mjs
└── package.json
```

## Design-Tokens (tokens.css)
```css
:root {
  --c-night:   #2A3233;  /* Nachtblaugrau, Pantone 446 C */
  --c-teal:    #7ED1C9;  /* Hellblau, 630 C */
  --c-lime:    #CCFF00;  /* Neon lime, 396 C */
  --c-magenta: #FF00FF;  /* Magenta, 807 C */
  --c-white:   #FFFFFF;
  --font-brand: "KMR Apparat", "Inter", system-ui, sans-serif;
  --container: 1600px;
  --gutter-desktop: 160px;
  --gutter-mobile: 24px;
}
```

## SEO-Checkliste
- Eine `<h1>` (Hero „Build Beyond."), pro Sektion eine `<h2>`
- `<title>`, `<meta name="description">`, OG/Twitter-Tags aus `meta` in der JSON
- JSON-LD `Organization` (Name, Adresse, Founder, URL, Logo)
- `sitemap.xml` (Astro-Integration `@astrojs/sitemap`), `robots.txt`
- Bilder: WebP/AVIF über `astro:assets`, `width`/`height` gesetzt, Hero `loading="eager"`, Rest `lazy`
- Fonts: selbst gehostet, `font-display: swap`, Preload für Regular + Medium
- Alle Inhalte ohne JS sichtbar; Animationen setzen nur obendrauf
- `prefers-reduced-motion`: Scroll-Animationen, Marquee, Hex-Cursor aus
- Impressum/Datenschutz als eigene Seiten (Pflicht in DE)

## Animationen (Übersicht)
1. Hero Typo-Effekt „Build Beyond." (scroll-getrieben, GSAP Scrub)
2. Hero Bild-Parallax
3. Nav transparent → Nachtblau/Blur beim Scrollen
4. Section-Reveal (Fade + 24 px hoch, IntersectionObserver)
5. Mission-Prinzipien gestaffelt
6. Marquee, zwei Reihen gegenläufig
7. Warum-K+-Slider mit Fortschrittslinie + Zähler (Desktop), Stack (Mobile)
8. Karten-Glow Hover
9. Portfolio Logo-Wall: gestaffeltes Erscheinen, Hover-Lift, Magenta-Glow, Aktiv-Rahmen
10. Portfolio Spotlight-Wechsel: Cross-Fade + Zoom 1.05→1.0, Text-Slide
11. Schwerpunkte Bild-Parallax + gestaffelte Items
12. CTA-Glow (langsamer Puls)
13. Button-Hover 200 ms
14. Smooth Scroll (Lenis) + Anker-Navigation
15. Hex-Cursor: Magenta-Hexraster wird im Radius um den Mauszeiger sichtbar (Canvas, nur Pointer-Geräte)

## Material (Stand 08.09.2026, geprüft)
| Asset | Status |
|---|---|
| Font KMR Apparat | alle 7 Schnitte als WOFF2 entpackt in `_material/fonts/WOFF2/`; Weblizenz vom Kunden bestätigen lassen |
| Logo K+ (Bildmarke für Nav/Footer/Favicon) | **fehlt** – aus Figma Node 139:34 exportieren oder vom Kunden anfordern |
| Logo Kappes | SVG vorhanden (`einzeilig-logo_kappes (neu).svg`, Wortzeichen) |
| Logos Place (738×288), VynciTech (738×228), yolean/WeLean (500×170), Kappes + Kemper (1323×454) | PNG mit Transparenz – für die Teal-Maske brauchbar, SVG trotzdem nachfordern |
| Logo i-pro Kom | JPEG 354×165 ohne Transparenz – nicht maskierbar, wird vorerst farbig gezeigt; SVG/PNG transparent nachfordern |
| Fotos Hero/Vision/Schwerpunkte | 4 Pexels-Motive (Baukräne) vorhanden, Zuordnung in `docs/ASSETS.md` |
| Founder-Porträt | vorhanden (5239×7854, 11,8 MB, auf 1600 px verkleinern) |
| Portfolio-Fotos (6×) | fehlen – Platzhalter aus den Kran-Motiven |
| Portfolio-Texte + Tags | in `content/de.json` eingetragen |
| Icons Warum-K+ (5×) | aus Figma exportieren (Node-IDs in `docs/DESIGN-SPEC.md`) |

## Build-Setup für Claude Code
Der Build ist in neun Phasen aufgeteilt: `CLAUDE.md` (Regeln), `docs/BUILD-PHASES.md` (Übersicht + Status), `docs/phases/PHASE-0…8.md` (je Phase Aufgaben + Definition of Done), `docs/DESIGN-SPEC.md` (Maße aus Figma), `docs/ASSETS.md` (Material-Zuordnung).

## Offene Punkte
Blockierend für den Build-Start: keine – Start mit Platzhaltern.

Vom Kunden:
1. Mailadresse für Pitch/Kontakt – **geliefert (2026-09-14):** `pitch@kplus.build` / `kontakt@kplus.build`, in `de.json` eingetragen
2. Impressum und Datenschutzerklärung – **Entwurf drin (2026-09-14):** von kappes.group übernommen und auf die Kplus GmbH angepasst (`de.json` `legal.pages.*.sections`, gerendert von `Legal.astro`; IONOS als Hoster, keine Cookies/Analytics, Kontakt per E-Mail). **Vom Kunden noch zu liefern:** Telefonnummer, HRB-Nummer, USt-IdNr. (Platzhalter `[folgt]`), Aussage ob ein Datenschutzbeauftragter bestellt ist, ggf. Credit „Website Konzeption & Umsetzung". Danach `legal.noindex: false`.
3. Domain + IONOS-Hosting-Paket, danach FTPS-Zugangsdaten → als GitHub-Secrets für die Deploy-Action (`IONOS_HOST`, `IONOS_USER`, `IONOS_PASSWORD`, `IONOS_STAGING_DIR`, `IONOS_REMOTE_DIR` – `.github/workflows/deploy.yml`); mit der Domain `meta.siteUrl` in `de.json`, `public/robots.txt` und den www-Redirect in `public/.htaccess` final setzen
4. Website-URLs der sechs Beteiligungen (`url` in `de.json` noch leer außer kappes.group)
5. Logos als SVG bzw. transparente PNGs ≥ 800 px (siehe Tabelle)
6. Optional: je ein Foto pro Beteiligung fürs Spotlight-Panel
7. Bestätigung Webfont-Lizenz KMR Apparat
8. Bestätigung „Fünf Überzeugungen" (im Figma steht „Fünf Verurteilungen")
9. K+-Bildmarke als SVG (fehlt im Material – Nav, Footer, Favicon)
10. Mobile-Navigation – **entschieden (2026-09-09): bleibt ohne Burger-Menü**, wie im Figma nur das Logo (kein Anker-Menü); Kontakt über die Hero-/CTA-Buttons, 768–1023 bleibt der Kontakt-Button in der Leiste. Umgesetzt (DESIGN-SPEC.md Abweichung 7).

Intern:
- Icons der Warum-K+-Karten aus Figma als SVG exportieren
- ~~OG-Bild 1200×630 gestalten~~ – erledigt (Phase 8, `npm run og-image`)
- ~~Deploy-Action anlegen~~ – angelegt (Phase 8); erster Staging-Deploy, sobald die Secrets gesetzt sind; danach Rich-Results-Test und Search Console auf der Live-URL
- Hero-Video (nicht im Repo) nach dem ersten Deploy von Hand nach `/video/hero.mp4` auf den Webspace, sobald die lizenzierte Fassung da ist
- Rechtstexte eintragen → `legal.noindex` in `de.json` auf `false` (Seiten indexierbar, wieder in der Sitemap)
- Kunden-Vorschau: https://elkocho1.github.io/k-onepager/ (GitHub Pages, `.github/workflows/pages.yml`, bei jedem Push auf `main`, `noindex`); vor dem Livegang optional abschalten (Settings → Pages → Source „None")

## Ablauf Build (Claude Code)
1. Repo in den lokalen Ordner klonen, `de.json` + diese Datei + `_material/` ablegen
2. Astro-Projekt nach obiger Struktur aufsetzen, Assets nach `public/`
3. Tokens, Base-Layout, Meta/JSON-LD
4. Sektionen statisch in Reihenfolge Hero → Footer, nach jedem Schritt `npm run build`
5. Mobile-Breakpoints nach Mobile-Frame
6. Animationen (Liste oben), `prefers-reduced-motion`
7. Impressum/Datenschutz, Sitemap, robots
8. Deploy-Action, Livegang nach Freigabe
