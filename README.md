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
npm run dev              # http://localhost:4321
npm run build            # → dist/
npm run preview
npm run check            # astro check (TypeScript)
```
