# K+ Onepager

Statischer Onepager für die Kplus GmbH (Stuttgart, Claim „Build beyond."). Astro 7, kein CMS, Hosting IONOS.

- Regeln und Stack: `CLAUDE.md`
- Build-Phasen und Status: `docs/BUILD-PHASES.md`, Details je Phase in `docs/phases/`
- Design-Spec (aus Figma): `docs/DESIGN-SPEC.md`
- Material-Zuordnung: `docs/ASSETS.md`
- Alle Texte, Links, Bildpfade: `content/de.json`

## Befehle

```
npm install
npm run prepare-images   # _material/Bilder → src/assets/images/ (sharp)
npm run subset-fonts     # _material/fonts/WOFF2 → public/fonts/ (Latin-1 + Typo-Zeichen, fontTools)
npm run og-image         # scripts/og.html → public/og/kplus-build-beyond.jpg (Headless Chrome)
npm run dev              # http://localhost:4321
npm run build            # → dist/
npm run preview
# Vorschau-Build wie auf GitHub Pages (Unterordner, noindex) – PowerShell:
#   $env:PUBLIC_BASE_PATH='/k-onepager'; $env:PUBLIC_SITE_URL='https://elkocho1.github.io'; $env:PUBLIC_PREVIEW='true'; npm run build
# Ohne diese Variablen ist es der Produktions-Build (base '/', Domain aus de.json).
npm run check            # astro check (TypeScript)
npm run check:phase -- 1 index impressum   # Screenshots (docs/screens) + Lighthouse a11y via Chrome headless
node scripts/browser-eval.mjs http://127.0.0.1:4321/ "document.title"   # JS im Headless Chrome auswerten (Preview vorher starten)
```
