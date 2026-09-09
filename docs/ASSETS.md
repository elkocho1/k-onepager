# Assets – Zuordnung `_material/` → Projekt

`_material/` ist Rohmaterial (gitignored). In Phase 0 werden die Dateien wie unten aufbereitet und abgelegt. Bildpfade in `content/de.json` sind bereits auf die Zielnamen gesetzt.

## Fonts → `public/fonts/`

Quelle: `_material/fonts/WOFF2/`. Alle sieben Schnitte vorhanden (Light, Book, Regular, Medium, Bold, Heavy, Black).

| Datei | font-weight | Verwendung |
|---|---|---|
| KMR-Apparat-Regular.woff2 | 400 | Body, H2, Nav |
| KMR-Apparat-Medium.woff2 | 500 | Buttons, Tile-Namen, Footer-Stadt |
| KMR-Apparat-Bold.woff2 | 700 | Eyebrows, Prinzip-/Schwerpunkt-Titel, Marquee-Outline |
| KMR-Apparat-Heavy.woff2 | 800 | Display (Hero, CTA) |
| KMR-Apparat-Book.woff2 | 350 | aktiver Nav-Link (optional, sonst 400) |

Light und Black **nicht** einbinden. Preload: Regular + Medium. `@font-face` mit `font-display: swap`, `unicode-range` nicht nötig.
Offen: Weblizenz vom Kunden bestätigen lassen (siehe PROJEKT-STRUKTUR.md).

## Fotos → `src/assets/images/` (astro:assets)

| Ziel | Quelle | Bearbeitung |
|---|---|---|
| `hero.jpg` | `Bilder/pexels-timothy-huliselan-…jpg` (4000×3000, Querformat) | auf 2560 px Breite, Qualität 80 |
| `vision.jpg` | `Bilder/pexels-jerry-zhang-…jpg` (2420×3232, Hochformat – Kräne mit Laub, entspricht Figma) | auf 1600 px Breite |
| `schwerpunkte.jpg` | `Bilder/pexels-anatoleos-…jpg` (3542×5398) | auf 2000 px Breite; Figma zeigt eine Wireframe-Skyline (`hero-architecture-Photoroom`) – Kundenmaterial fehlt, Kran-Motiv ist Platzhalter |
| `founder-alexander-kappes.jpg` | `Bilder/kappes Alexander.jpg` (5239×7854, 11,8 MB) | auf 1600 px Breite, Fokus Gesicht oben, Qualität 82 |
| `portfolio/kappes-group.jpg` … `portfolio/kappes-kemper.jpg` (6×) | fehlen → Platzhalter: `Bilder/pexels-sunny-yadav-…jpg` und die anderen Kran-Motive rotierend | auf 1600 px Breite |

Alle Bilder per `sharp` (kommt mit Astro) vorab verkleinern, z. B. `npx sharp-cli` oder ein kleines Node-Script `scripts/prepare-images.mjs`. Ausgabe im Build als WebP + AVIF über `<Picture>`.

## Logos → `public/logos/` (einfarbig via CSS-Mask)

Die Logo-Wall färbt Logos per `mask-image` teal ein – dafür braucht jede Datei **Transparenz**. Ziel: SVG mit `fill` egal (wird maskiert), viewBox passend.

| Ziel | Quelle | Status |
|---|---|---|
| `kplus.svg` (Nav/Footer, Favicon) | **fehlt im Material.** `einzeilig-logo_kappes (neu).svg` ist das Kappes-Wortzeichen (K-Symbol + „Kappes", 938×253, fill #0026FF), nicht die K+-Marke. Figma Node `139:34` enthält die Marke nur als PNG (674×370 mit transparentem Rand, teal) → Interim `kplus.png` in `public/logos/`, per `prepare-images.mjs` auf 481×165 getrimmt (Quelle `_material/figma-export/`, `nav.logo` in de.json). SVG vom Kunden anfordern; `favicon.svg` ist bis dahin ein teal Quadrat | **Interim PNG, SVG offen** |
| `kappes-group.svg` | `Logos/einzeilig-logo_kappes (neu).svg` (7 Pfade, fill #0026FF → wird maskiert, Farbe egal) | ok |
| `place-strategy.png` | `Logos/Place.png` 738×288, **ohne Alphakanal** (weißer Hintergrund) | Weiß wird in `scripts/prepare-images.mjs` freigestellt (Alpha aus dunkelstem Kanal); SVG nachfordern |
| `vyncitech.png` | `Logos/vynci.png` 738×228, **ohne Alphakanal** (weißer Hintergrund) | Weiß wird in `scripts/prepare-images.mjs` freigestellt; SVG nachfordern |
| `welean.png` | `Logos/yolean.png` 500×170 | knapp (Höhe 64 → 2× = 128 px ok); SVG nachfordern |
| `kappes-kemper.png` | `Logos/Kappes-und-Kemper-Logo-2 (1).png` 1323×454 RGBA | ok für Maske |
| `i-pro-kom.jpg` | `Logos/i-pro.jpeg` 354×165, **keine Transparenz** | unbrauchbar für Maske → im Figma wird das Logo unmaskiert farbig gezeigt. Interim: Bild ohne Maske, eigener Fall in der Komponente (`mask: false` in de.json gesetzt) |

Alle Logos werden von `scripts/prepare-images.mjs` aus `_material/` nach `public/logos/` kopiert bzw. freigestellt. `de.json` verweist seit Phase 0 auf die realen Endungen (`.svg`/`.png`/`.jpg`) und trägt je Firma `mask: true|false`; sobald SVGs vom Kunden kommen, Pfade zurück auf `.svg`.

## Icons → `public/icons/warum/` (5× SVG, 50×50, einfarbig)

Aus Figma exportieren (Selection → Export SVG), Node-IDs in DESIGN-SPEC.md Abschnitt 5. Dateinamen = `icon`-Wert in `de.json`: `partnership.svg`, `building.svg`, `project.svg`, `network.svg`, `capital.svg`. Alle Füllungen auf `currentColor` setzen.

Stand Phase 0: `building` (139:97), `project` (75:503) und `network` (75:516) sind exportiert und bereinigt (viewBox 0 0 50 50, `fill="currentColor"`, `aria-hidden`). `partnership` (Maskengruppe 139:85) und `capital` (Gruppe 75:528) liegen im Figma nur als Rasterbilder vor → Platzhalter-Kreise mit TODO-Kommentar; die 512×512-PNGs (transparent) sind in `_material/figma-export/` abgelegt und könnten notfalls per `mask-image` genutzt werden.

## Sonstiges

- `public/favicon.svg`: K+-Bildmarke, teal auf transparent.
- `public/og/kplus-build-beyond.jpg`: 1200×630, night-Hintergrund, „Build Beyond." weiß/lime, Logo – in Phase 8 gestalten (HTML→Screenshot via Playwright oder Figma).
- `_material/Kappes Beteiligungstexte_.docx`: Quelle der Portfolio-Texte, bereits in `de.json` übernommen.
