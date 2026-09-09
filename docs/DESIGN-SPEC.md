# K+ Onepager – Design-Spec (aus Figma „K+ Design")

Desktop-Frame `139:2` (1920 px breit), Mobile-Frame `242:21` (390 px breit).
Alle Angaben in px bei 1920 bzw. 390. Farben/Schriften über Tokens (siehe unten). Node-IDs dienen zum Nachschlagen per Figma MCP (`get_design_context`).

## Tokens

```css
:root {
  --c-night:    #2A3233;  /* Hintergrund, Pantone 446 C */
  --c-teal:     #7ED1C9;  /* Headlines, Fließtext-Akzent, 630 C */
  --c-lime:     #CCFF00;  /* Prinzip-Titel, Outline-Headlines, 396 C */
  --c-magenta:  #FF00FF;  /* Rahmen, Glow, Aktiv-Zustände, 807 C */
  --c-magenta-text: #FF67FF; /* Magenta-Text auf Night und Spotlight-Tönung: Eyebrows, Button-/Nav-CTA-Text – siehe Abweichung 8 */
  --c-white:    #FFFFFF;
  --c-muted:    #8AADA9;  /* Slider-Label und Zähler */
  --c-line:     rgba(126,209,201,.16);   /* Footer-Trennlinie */
  --c-card-bg:  rgba(255,255,255,.05);
  --c-tile-bg:  rgba(255,255,255,.04);
  --c-tile-border: rgba(255,255,255,.12);
  --c-spot-bg:  rgba(126,209,201,.08);

  --font-brand: "KMR Apparat", "Inter", system-ui, sans-serif;

  --container: 1600px;      /* Inhaltsbreite Desktop */
  --gutter: 160px;          /* Seitenrand Desktop (1920) */
  --gutter-mobile: 24px;    /* Seitenrand Mobile (390) */
  --section-gap: 120px;     /* vertikaler Abstand zwischen Sektionen Desktop */
  --section-gap-mobile: 72px;
}
```

### Typo-Skala (Desktop → Mobile)

| Rolle | Schnitt | Desktop | Mobile | Farbe |
|---|---|---|---|---|
| Display (Hero, CTA) | KMR Apparat Heavy | 120 / 1.0, Zeilen überlappen −20 px | 78 / 1.0 (Hero), 36 (CTA, Zeilen überlappen −6 px) | weiß + Outline-Zeile |
| H2 Sektion | KMR Apparat Regular | 42 / 1.2, tracking 0.96 | 34 / 1.2 | teal |
| H3 Karte / Prinzip | Inter Bold bzw. KMR Regular | 24 (Prinzip, Schwerpunkt) · 42 (Warum-K+-Karte) | 22 · 30 | lime (Prinzip/Schwerpunkt), teal (Karte) |
| Eyebrow | KMR Apparat Bold | 14, uppercase, tracking normal | 14 | magenta |
| Body | KMR Apparat Regular / Inter Regular | 18 / 28 | 18 / 28 (Mobile ggf. 16/26) | weiß, teal für Subline |
| Button | KMR Apparat Medium | 16, uppercase, tracking 1 px | 16 | siehe Buttons |
| Nav | KMR Apparat Regular / Book (aktiv) | 16 | – | teal, aktiv weiß |
| Marquee | KMR Apparat Regular + Bold-Outline | 42, tracking 0.96 | 33 | teal / Outline teal |
| Statement-Karte | Inter Regular | 32 / 1.25, zentriert | 24 | teal |
| Portfolio-Tile-Name | KMR Apparat Medium | 24, tracking 0.96 | 15.5 | weiß (aktiv 100 %, sonst 70 %) |
| Chip | Inter Medium | 14 | 14 | teal |
| Footer-Text | KMR Apparat Regular | 18 / 28 | 18 | teal |
| Footer-Stadt | KMR Apparat Medium | 24, tracking 0.96 | 24 | magenta |

**Hinweis Schriften:** Figma nutzt KMR Apparat in Heavy, Bold, Medium, Regular, Book – und an neueren Stellen Inter (Mission, Portfolio, Founder, Schwerpunkte, CTA-Subline), weil KMR im Figma-Konto nicht ladbar war. **Im Code überall KMR Apparat verwenden**, Inter nur als Fallback. Schnitte laut Designmanual eigentlich nur Regular + Medium – Heavy (Display) und Bold (Eyebrow) sind Figma-Entscheidungen; alle Schnitte liegen als WOFF2 vor. Fallback-Zuordnung: Inter Bold → KMR Medium, Inter Regular → KMR Regular.

**Outline-Text** (zweite Display-Zeile „Beyond.", „Together.", jeder zweite Marquee-Eintrag): `color: transparent; -webkit-text-stroke: 2px var(--c-lime)` (Hero/CTA lime, Marquee teal). Hero-Outline im Figma zusätzlich mit tracking 10 px.

### Buttons

- **Primär (Magenta-Outline):** `border: 1px solid var(--c-magenta)`, Text magenta, padding 12.5px 16px, transparent. Hover: Hintergrund magenta, Text night, 200 ms.
- **Sekundär (Weiß-Outline):** `border: 1px solid #fff`, Text weiß, Hintergrund `rgba(126,209,201,.10)`. Hover: Hintergrund weiß, Text night.
- Mobile: volle Breite (342 px), Höhe 46, untereinander mit 12 px Abstand (Hero, CTA).

### Eyebrow-Pattern (überall gleich)

Eyebrow (14, Bold, uppercase, magenta, 8 px vertical padding) → 24 px → H2 (42, teal) → 24 px → Body. Bei Vision/Mission/Portfolio/Founder ist der Eyebrow linksbündig, bei Schwerpunkte/CTA zentriert.

---

## Sektionen (Desktop)

### 0 Header / Nav – Node `139:32`

- `position: fixed`, top 20 px, links/rechts 160 px (Container 1600), Höhe 60 px. Transparent auf dem Hero.
- Links Logo (K+ Bildmarke, 174×60, SVG aus `_material/Logos/einzeilig-logo_kappes (neu).svg` – siehe ASSETS.md), Mitte Nav-Links mit 30 px gap, rechts Primär-Button „Kontakt aufnehmen" (Breite 222).
- Nav-Links: teal, aktiver Abschnitt weiß (Book). **Bewusste Abweichung:** Figma zeigt fünf Einträge (inkl. „Echte Baukompetenz", „Fundierte Branchenexpertise") – umgesetzt werden nur die drei aus `de.json` (Warum K+, Unsere Beteiligungen, Unsere Schwerpunkte).
- Beim Scrollen (> 40 px): Hintergrund `rgba(42,50,51,.85)` + `backdrop-filter: blur(12px)`, top 0, Höhe 76, Übergang 300 ms (Phase 7).
- Mobile (`242:27`): Höhe 76, Logo 104×36 bei 24/20 px, **kein Burger-Menü** (Figma-Entscheidung) – nur Logo; die Nav-Links entfallen, der Kontakt-Button entfällt (Kontakt über Hero-/CTA-Buttons).

### 1 Hero – Node `139:14` (1918×936)

- Vollbreites Hintergrundbild (`hero.jpg`, object-fit cover), darüber zwei Verläufe: oben `linear-gradient(180deg, #2A3233 0%, rgba(42,50,51,.3) 100%)` über 469 px, unten gespiegelt (`#2A3233 3.8% → rgba(42,50,51,.4)`) über 469 px. Ergebnis: Bild ist in der Mitte am sichtbarsten, Kanten laufen in night aus.
- Textblock: links 160 px, vertikal zentriert (Mitte +30 px), Breite 809, flex-column gap 40.
  - Eyebrow „Venture & Innovation Platform" (14, magenta, padding 8/16)
  - Headline `<h1>` zwei Zeilen: „Build" weiß, „Beyond." Outline lime; 120 px Heavy, Zeilen mit −20 px Überlappung
  - Body 18/28 weiß, Zeilenumbruch nach dem ersten Satz (`de.json` `hero.text`, `\n` → `<br>`)
  - Buttons: Primär „Pitch einreichen", Sekundär „Beteiligungen entdecken" (Breite 272), gap 14
- Mobile (`242:22`, 390×780): Textblock ab y 226, Padding 24, Headline 78 px, Body ab 224, Buttons volle Breite untereinander.

### 2 Vision – Node `139:45`

- Zwei Spalten, gap 120, vertikal zentriert: Bild links 778×650 (object-fit cover, Ausschnitt leicht rechts), Text rechts Breite 702.
- Text: Eyebrow „Build beyond. Vision" → H2 (42, teal, tracking 0.96) → zwei Absätze (18/28, weiß, gap 16).
- Mobile (`242:46`): Bild oben 342×260, danach Text; Padding oben 72.

### 3 Mission – Node `144:2` (direkt unter Vision, gap 80)

- Zwei Spalten, gap 203: links Text Breite 702 (Eyebrow „Build beyond. Mission", H2 42, Body 18/28), rechts drei Prinzipien Breite 778, untereinander gap 50.
- Prinzip: `border-left: 1px solid var(--c-lime)`, padding-left 16, Titel 24 Bold lime, darunter (gap 14) 18/28 teal.
- Mobile (`242:55`): Text oben, Prinzipien darunter (gap 24 zwischen Prinzipien, Höhe je 64).

### 4 Marquee – Node `139:59` (Höhe 122)

- Zwei Zeilen à 55 px, Abstand 12, jeweils 4 Einträge aus `de.json` `marquee.rows`, gap 50, whitespace nowrap, Text 42 tracking 0.96.
- Einträge abwechselnd: teal Regular / Outline (transparent + Bold-Stroke teal). Zeile 1 startet mit Outline, Zeile 2 mit Regular.
- Links und rechts Fade-Masken 522 px breit (`#2A3233 → transparent`).
- Zeile 1 läuft nach links, Zeile 2 nach rechts (Phase 7). Statisch: Zeile 1 rechtsbündig, Zeile 2 linksbündig.
- Mobile (`242:70`): Höhe 90, Text 33 px, Zeilen 44 px versetzt.

### 5 Warum K+ – Node `139:72` (Höhe 607) – `id="warum-kplus"`

- Kopfzeile Container 1600, `justify-content: space-between`, `align-items: flex-end`: links Eyebrow „ECHTE BAUKOMPETENZ" (Breite 163, umbrechend) + H2 „Wir investieren nicht nur – wir bauen mit."; rechts Label `sliderLabel` (16/26.4, muted, Arimo → KMR Regular).
- Karten-Reihe: horizontal scrollbar, Breite 1760 (läuft rechts über den Container hinaus, 160 px Einzug nur links), gap 32. **Sechs Karten**: fünf Feature-Karten + eine Statement-Karte.
- Feature-Karte: Hintergrund `--c-card-bg`, 1 px Rahmen night, padding 50, Inhaltsbreite 561 (Karte 1–2) bzw. 536 (Karte 3–5) → im Code einheitlich **Karte 636 breit** (536 + 2×50), Höhe auto (ca. 403).
  - Oben Icon 50×50 magenta (SVG als `mask-image` mit `background: var(--c-magenta)` oder inline SVG mit `fill: currentColor`), danach gap 100.
  - Titel 42 KMR Regular teal, tracking 0.96; gap 14; Text 18/28 weiß (Karte 3–5 im Figma 16/28 → einheitlich 18).
  - Glow: absolut positionierter Kreis 384×384 bei left −1 / top −170, `filter: blur(32px)`, `linear-gradient(142deg, rgba(204,255,0,.05) 43%, rgba(204,255,0,0) 96%)`, `overflow: hidden` an der Karte.
- Statement-Karte (`166:2`): gleiche Hülle, Inhalt 536×243 zentriert, Text 32/1.25 Inter → KMR Regular, teal, zentriert.
- Fortschrittslinie (`139:185`): unter den Karten (gap 40), Linie 1540 px breit, 1 px `rgba(126,209,201,.3)`, gefüllter Anteil **magenta** (`--c-magenta`, Figma-Linie `139:188` = #FF00FF – frühere Angabe „teal" war ein Extraktionsfehler); rechts daneben Zähler „01/06" (18, muted).
- Mobile (`242:81`): Karten gestapelt, Breite 342, gap 12, padding 28, Icon 40×40, Titel 30, Text 18/28 (16 falls zu lang), Glow-Kreis 230 px bei −40/−120. Keine Fortschrittslinie.
- Icons: 5 Stück aus Figma exportieren (Knoten `139:87` partnership-Maske, `139:97` building, `75:503` project, `75:516` network, `75:530` capital-Maske) → `public/icons/warum/*.svg`, einfarbig, viewBox 0 0 50 50.

### 6 Portfolio – Node `227:2` (1920×1280) – `id="portfolio"`

- Kopf: Breite 974, Eyebrow „Build beyond. Portfolio" → H2 → Intro 18/28 weiß. Danach gap 56.
- **Logo-Wall**: 3×2 Grid, Tiles 522×240, gap 16, radius 8. Tile: Hintergrund `--c-tile-bg`, Rahmen 1 px `--c-tile-border`, Inhalt zentriert: Logo (Höhe 64, Breite je Logo 138–314) + gap 20 + Name 24 Medium weiß 70 %.
  - Logos einfarbig teal: `background: var(--c-teal); mask: url(logo.svg) center / contain no-repeat` – benötigt SVG/PNG mit Transparenz.
  - **Aktiv-Zustand** (Kappes Group initial): Hintergrund `rgba(255,255,255,.07)`, Rahmen 1.5 px magenta, `box-shadow: 0 0 32px rgba(255,0,255,.35)`, Name 100 % weiß.
  - Hover: translateY(−4px), Rahmen `rgba(255,0,255,.5)`, 200 ms.
- **Spotlight-Panel** (gap 56 nach der Wall): 1600×480, radius 12, Hintergrund `--c-spot-bg`, Rahmen `--c-tile-border`, `overflow: hidden`. Zwei Spalten:
  - Links Textspalte 680 breit, padding 56, flex-column gap 28, vertikal zentriert: Logo teal (Höhe 64), Text 18/28 weiß, Chips (flex-wrap gap 12, padding-top 8), Button „Webseite" (Primär, padding 12.5/24).
  - Trennlinie 1 px: `linear-gradient(180deg, rgba(255,0,255,0), rgba(255,0,255,.9) 50%, rgba(255,0,255,0))`.
  - Rechts Bild (flex 1, Höhe 100 %, object-fit cover) mit Overlay `linear-gradient(90deg, rgba(42,50,51,.95) 0%, rgba(42,50,51,.2) 55%, rgba(42,50,51,0) 100%)`.
  - Chip: Rahmen 1 px `rgba(126,209,201,.4)`, radius 999, padding 8/16, Text 14 Medium teal.
  - Button „Webseite" nur rendern, wenn `url` in `de.json` nicht leer ist.
- Verhalten: Klick auf Tile → Spotlight zeigt Firma (alle sechs Spotlights im HTML rendern, nur eines sichtbar; ohne JS ist das erste sichtbar). Tiles sind `<button aria-pressed>`; Spotlight-Wechsel über `hidden`-Attribut. Cross-Fade in Phase 7.
- Mobile (`242:149`): Wall 2×3, Tiles 165×128 gap 12, Logo max 118×36, Name 15.5. Spotlight gestapelt: Bild oben 342×200, Accent-Line horizontal, Text darunter padding 24/28.

### 7 Schwerpunkte – Node `139:379` (1918×832) – `id="schwerpunkte"`

- Hintergrund: Bild (`schwerpunkte.jpg`, 1373×832 zentriert, cover) mit vier Verläufen zu night: oben 445 px, unten 395 px, links und rechts je 960 px breit (`#2A3233 13% → transparent`). Ergebnis: Bild nur in der Mitte sichtbar. **Zusätzlich** Overlay night 60 % über allem, damit Text lesbar bleibt (Mobile-Frame hat ein eigenes `Overlay`-Rechteck).
- Kopf zentriert, Breite 850, top 63: Eyebrow „Unsere Schwerpunkte" (16 statt 14, zentriert) → H2 „Wo wir investieren." zentriert.
- Zwei Spalten à 460 px, `space-between` im 1600-Container, top 229: links 3 Items linksbündig mit `border-left` lime, rechts 3 Items rechtsbündig (`text-align: right`, `border-right` lime, padding-right 16). Items untereinander gap 50; Titel 24 Bold lime, Text 18/28 teal, gap 14. Reihenfolge = `de.json` `schwerpunkte.items` (1–3 links, 4–6 rechts).
- Mobile (`242:203`): alle 6 Items linksbündig untereinander, gap 24, Padding 24, Bild als Hintergrund mit Overlay.

### 8 Founder – Node `139:411` (1918×638) – `id="founder"`

- Zwei Spalten, gap 60: links Bild 713×515 (Porträt, object-fit cover, Fokus oben), rechts Text Breite 827.
- Text: Eyebrow „Build beyond. Founder" → Name 42 teal → gap 10 → Rolle 18/28 lime → gap 24 → vier Absätze 18/28 weiß, gap 16.
- Mobile (`242:234`): Bild 342×247 oben, Text darunter.

### 9 CTA – Node `139:457` (1918×516) – `id="kontakt"`

- Zentriert, flex-column gap 40. Hintergrund-Glow: Kreis 775 px, zentriert, top −130, `blur(32px)`, radialer Verlauf lime 10 % → transparent.
- Eyebrow „Für Gründer. Für Innovatoren." → Display zwei Zeilen: „Let's build beyond." weiß, „Together." Outline lime, 120 Heavy, −20 px Überlappung, zentriert → Subline 18/28 teal, zentriert, Breite 1006, zwei Zeilen (`\n`).
- Buttons gap 16: Primär „Pitch einreichen" (mailto), Sekundär „Kontakt aufnehmen" (mailto, ohne Teal-Füllung: transparent).
- Mobile (`242:247`): Display 36 px (Zeilenhöhe 46,8 – frühere Angabe „46.8 px" war die Zeilenhöhe; bei 46,8 px Schrift bricht die erste Zeile um), Überlappung −6 px, Outline-Tracking 3 px, Buttons volle Breite untereinander (gap 12), Glow 426 px bei −40.

### 10 Footer – Node `139:469` (1918×392)

- Zentriert: Logo 136×47 → gap 24 → Claim 18/28 teal, zentriert, Breite 448 → gap 40 → Linie 134 px (1 px teal 40 %) → gap 40 → „Stuttgart" (24 Medium magenta) → gap 14 → Adresse 18/28 teal.
- Untere Leiste: `border-top: 1px solid var(--c-line)`, padding 25/0/24, `space-between`: Copyright links, rechts Links „Impressum" · „Datenschutz" gap 25.6 (alle 18 teal).
- Mobile (`242:260`): linksbündig, Logo 116×40, Linie volle Breite, Legal-Links über dem Copyright.

---

## Seitenaufbau / Abstände Desktop (Y-Positionen im Figma)

Hero 0–936 · Vision/Mission 1016–2261 · Marquee 2139–2261 · Warum K+ 2382–2989 · Portfolio 3109–4389 · Schwerpunkte 4509–5341 · Founder 5461–6099 · CTA 6219–6735 · Footer 6855–7248.
→ Zwischen den Sektionen konsistent **120 px** (`--section-gap`), Mobile 72 px.

## Breakpoints

- `≥ 1440`: Desktop-Layout 1:1, Container 1600 skaliert per `min(1600px, 100vw - 2*var(--gutter))`.
- `1024–1439`: Desktop-Layout, Gutter 64, Spalten proportional (`grid`/`flex` mit `minmax`), Display 96 px, H2 36.
- `768–1023`: Zweispalter werden einspaltig (Mobile-Anordnung), Gutter 40, Logo-Wall 2 Spalten.
- `< 768`: Mobile-Frame 1:1 (Gutter 24, Buttons volle Breite, Display 78).

Fluid Type für Display/H2 mit `clamp()` zwischen Mobile- und Desktop-Wert.

## Bewusste Abweichungen vom Figma

1. Nav mit drei statt fünf Einträgen (Entscheidung Michael/Kunde).
2. Überall KMR Apparat statt der Inter-Reste im Figma.
3. Warum-K+-Karten einheitlich 636 px breit und 18 px Body (Figma mischt 561/536 und 18/16).
4. Schwerpunkte: Eyebrow 14 px wie überall (Figma 16).
5. Slider-Label „Fünf Überzeugungen" aus `de.json` (Figma: „Fünf Verurteilungen" – Kundenbestätigung offen).
6. „Webseite"-Button nur bei vorhandener URL.
7. Mobile ohne Burger-Menü wie im Figma – **offen**: ob ein minimales Menü (Anker-Links) gewünscht ist. Bis dahin: nur Logo.
8. Magenta-**Text** (Eyebrows, Text der Primär-Buttons, Nav-CTA-Text) nutzt `--c-magenta-text: #FF67FF` statt `#FF00FF`, damit WCAG AA (4,5:1 für 16-px-Text) auf allen Hintergründen erfüllt ist: auf Night 5,39:1 (statt 4,18:1), auf der Spotlight-Tönung `--c-spot-bg` 4,53:1 (statt 3,51:1) – Lighthouse hatte den Nav-Button auf den Rechtsseiten und den „Webseite"-Button im Portfolio-Spotlight beanstandet. Die Zwischenwerte reichten nicht: `#FF4DFF` (Phase 1) nur auf Night (4,84:1), nicht auf der Tönung (4,07:1); `#FF66FF` (Phase 4/5) rechnerisch 4,51:1 auf der Tönung, aber axe/Lighthouse rundet den gemischten Hintergrund auf `#313F3F` und kommt auf 4,49:1 – `#FF67FF` ist der kleinste Wert, der auch so 4,5:1 erreicht (4,51:1). Rahmen, Glow und Aktiv-Zustände (Portfolio-Tile, Trennlinie, Hover-Füllung) bleiben `--c-magenta`. Footer-Stadt „Stuttgart" bleibt `--c-magenta` (24 px Medium = großer Text, 3:1 genügt).
