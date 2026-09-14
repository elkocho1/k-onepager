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

## Deployment

Jeder Push auf `main` baut die Seite und lädt `dist/` per **SFTP** auf das IONOS-Webhosting des Kunden – Workflow `.github/workflows/deploy-ionos.yml` (auch manuell über *Actions → Deploy IONOS → Run workflow*). Parallel dazu veröffentlicht `pages.yml` die Kundenvorschau auf GitHub Pages.

**Zielordner:** `k-onepager/` unterhalb des Home-Verzeichnisses des SFTP-Users (im Workflow fest als `REMOTE_DIR`). Nur dieser Ordner wird geschrieben oder bereinigt – daneben liegt die bestehende Website des Kunden, die nicht angefasst wird. Die Seite wird mit `base: '/'` gebaut, der Ordner muss also in IONOS als Document Root einer (Sub-)Domain eingetragen sein.

**Secrets** (Repository → Settings → Secrets and variables → Actions → *Secrets*): `SFTP_HOST`, `SFTP_USER`, `SFTP_PASSWORD` (Port 22). Werte stehen nirgends im Repo, im Workflow nur als `${{ secrets.* }}`; GitHub maskiert sie im Log.

**Ablauf:** Checkout → Node-Major aus `package.json` (`engines.node`) → `npm ci` → `npm run build` (mit `PUBLIC_PREVIEW=true`, siehe Livegang) → `lftp` installieren → Host-Key → Zeitstempel aus dem Dateiinhalt ableiten → SFTP-Home **nur lesend** auflisten → `lftp mirror --reverse --delete` nach `k-onepager/`.

- `SamKirkland/FTP-Deploy-Action` kann kein SFTP (nur `ftp`/`ftps`), deshalb `lftp mirror`: hochgeladen wird nur, was sich in Größe oder Zeitstempel unterscheidet; Dateien, die es in `dist/` nicht mehr gibt, werden **innerhalb von `k-onepager/`** gelöscht (`dangerous-clean-slate` gibt es hier nicht – der Ordner wird nie komplett geleert). Damit unveränderte Dateien übersprungen werden, bekommt jede Datei in `dist/` vor dem Upload einen Zeitstempel, der aus ihrem Inhalts-Hash berechnet ist (gleicher Inhalt → gleiche mtime).
- `video/` ist in beide Richtungen ausgenommen: das Hero-Video liegt nicht im Repo (`docs/ASSETS.md`) und wird einmal von Hand nach `k-onepager/video/hero.mp4` gelegt; der Deploy löscht es nicht.
- Jeder Lauf schreibt die Auflistung des SFTP-Homes und die Upload-Operationen in die **Job-Summary** (Actions → Lauf → Summary) und als Annotationen.

**Sicherheitslauf (Dry-Run):** Im Workflow steht `DRY_RUN: 'true'`, solange der erste Lauf nicht geprüft ist – dann listet der Job das SFTP-Home nur lesend auf und simuliert den Upload mit `mirror --dry-run` (nichts wird geschrieben oder gelöscht). Im Summary prüfen: alle geplanten Operationen liegen unter `k-onepager/`, keine Löschung außerhalb. Danach `DRY_RUN` auf `'false'` setzen (Commit + Push = echter Deploy). Ein Dry-Run lässt sich jederzeit manuell auslösen: *Run workflow* → Haken bei *dry-run*.

**Host-Key:** Die SSH-Verbindung prüft den Host-Key streng (`StrictHostKeyChecking=yes`). Empfohlen ist, ihn zu pinnen: Repository-**Variable** `SFTP_KNOWN_HOSTS` (Settings → Secrets and variables → Actions → *Variables*, kein Secret – Host-Keys sind öffentlich) mit den `known_hosts`-Zeilen des Servers. Die Zeilen liefert der erste Lauf im Schritt „Host key" (und im Summary), alternativ lokal:

```
ssh-keyscan -p 22 -H <SFTP_HOST>
# Fingerprint zum Vergleich (z. B. mit der Anzeige beim ersten Login per FileZilla/WinSCP):
ssh-keyscan -p 22 <SFTP_HOST> | ssh-keygen -lf -
```

Ohne die Variable holt der Workflow den Key bei jedem Lauf per `ssh-keyscan` (Trust on first use) und meldet das als Warnung mit Fingerprint. Meldet ein Lauf „Host key verification failed", hat sich der Key geändert – Variable prüfen und nur nach Rücksprache mit IONOS neu setzen, nicht die Prüfung abschalten.

**Livegang** (sobald die Domain auf `k-onepager/` zeigt):

1. `astro.config.mjs`: `PLACEHOLDER_SITE` durch die echte Domain ersetzen (`https://www.<domain>`); `content/de.json` `meta.siteUrl` und die `Sitemap:`-Zeile in `public/robots.txt` angleichen.
2. `.github/workflows/deploy-ionos.yml`: die Zeile `PUBLIC_PREVIEW: 'true'` entfernen – erst dann steht `index, follow` in den Seiten (Impressum/Datenschutz bleiben `noindex`, bis `legal.noindex` in `de.json` auf `false` steht).
3. `public/.htaccess`: den auskommentierten Block „HTTPS and one host" aktivieren und den Host in der zweiten Regel auf die echte Domain setzen.

Anschließend Push auf `main` → Deploy; danach Rich-Results-Test und Search Console auf der Live-URL (`docs/phases/PHASE-8-seo-deploy.md`).
