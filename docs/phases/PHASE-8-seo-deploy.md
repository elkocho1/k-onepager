# Phase 8 – SEO, Performance, Rechtliches, Deploy

**Ziel:** Produktionsreif. Lighthouse (Mobile) Performance ≥ 90, alle anderen Kategorien ≥ 95. Automatisches Deployment von `main` auf IONOS.

**Input:** SEO-Checkliste in `PROJEKT-STRUKTUR.md`, Kundenlieferungen (Domain, IONOS-Zugang, Impressum/Datenschutz, Mailadressen).

## Aufgaben

### SEO / Meta

1. `astro.config.mjs` `site` auf die finale Domain; `de.json` `meta.siteUrl` gleichziehen. Canonical auf jeder Seite.
2. Sitemap prüfen (`dist/sitemap-index.xml`), `robots.txt` verweist darauf. Rechtsseiten aus der Sitemap ausschließen, sobald sie `noindex` verlieren, wieder aufnehmen.
3. OG-Bild `public/og/kplus-build-beyond.jpg` (1200×630) erstellen: HTML-Vorlage `scripts/og.html` mit Playwright screenshotten (night, „Build Beyond." weiß/lime-Outline, Logo, Claim).
4. JSON-LD `Organization` validieren (Google Rich Results Test / schema.org Validator), `sameAs` ergänzen, falls der Kunde LinkedIn liefert.
5. `<title>`/`description` je Seite prüfen (Startseite aus `de.json`, Rechtsseiten eigene).
6. Überschriften-Hierarchie und `alt`-Texte final durchgehen; Portfolio-Logos `alt` = Firmenname; dekorative Bilder `alt=""`.

### Performance

7. Bilder: Ausgabeformate AVIF + WebP, Hero LCP-Bild `fetchpriority="high"` + `<link rel="preload" as="image" imagesrcset imagesizes>` im Head, alle anderen lazy. Zielgrößen: Hero ≤ 250 kB (1920 AVIF), sonst ≤ 120 kB.
8. Fonts: nur 5 Schnitte, Preload Regular + Medium, Subsetting prüfen (pyftsubset auf Latin-1 + „–„“”" reicht) → jede Datei ≤ 40 kB.
9. JS: GSAP-Plugins nur die benötigten importieren, Animations-Script mit `<script>` (Modul, defer). Hex-Cursor lazy nach `load`.
10. CSS: `inlineStylesheets: 'auto'`, ungenutzte Utilities entfernen.
11. Lighthouse (Mobile + Desktop) auf `npm run preview` laufen lassen, Ergebnis in `docs/screens/lighthouse-phase-8.json` ablegen.

### Rechtliches

12. Impressum/Datenschutz mit Kundentext befüllen (Hoster IONOS muss in der Datenschutzerklärung stehen; keine Cookies, kein Tracking → einfacher Text). `noindex` entfernen.
13. Mailto-Adressen in `de.json` (`cta.primaryCta.href`, `cta.secondaryCta.href`) auf die echten Adressen setzen.
14. Beteiligungs-URLs in `de.json` eintragen, sobald geliefert; Webfont-Lizenz KMR Apparat schriftlich bestätigt (Notiz in `PROJEKT-STRUKTUR.md`).

### Deploy

15. `.github/workflows/deploy.yml`: Trigger `push` auf `main` + `workflow_dispatch`; Steps: checkout → `actions/setup-node@v4` (Node 22, npm cache) → `npm ci` → `npm run build` → SFTP-Upload von `dist/` nach IONOS (z. B. `SamKirkland/FTP-Deploy-Action@v4` mit `protocol: ftps` oder `wlixcc/SFTP-Deploy-Action`), `dangerous-clean-slate: false`, `exclude: .git*`. Secrets: `IONOS_HOST`, `IONOS_USER`, `IONOS_PASSWORD` (oder SSH-Key), `IONOS_REMOTE_DIR`.
16. IONOS: Domain auf das Webspace-Verzeichnis zeigen, HTTPS erzwingen (`.htaccess`: Redirect http→https und www-Variante vereinheitlichen, `Cache-Control` für `/_astro/*` 1 Jahr immutable, Fonts 1 Jahr, HTML `no-cache`). `.htaccess` in `public/` ablegen.
17. Erster Deploy auf ein Staging-Verzeichnis / Subdomain (z. B. `staging.kplus.de` oder `/staging/`), Freigabe durch Michael + Kunde, dann Produktion.
18. Nach Livegang: Search Console anlegen (Domain-Property), Sitemap einreichen, PageSpeed-Check auf der Live-URL.

## Definition of Done

- [x] Lighthouse Mobile: Performance ≥ 90, A11y ≥ 95, Best Practices ≥ 95, SEO 100 (2026-09-14: Mobile **96 / 100 / 100 / 100**, Desktop 100 / 100 / 100 / 100 – Status-Log)
- [x] `dist/` enthält sitemap-index.xml, robots.txt, og-Bild, .htaccess (dazu 404.html)
- [ ] Rich-Results-Test ohne Fehler – braucht die Live-URL; JSON-LD lokal strukturell geprüft (Organization, url, logo, founder, address), `sameAs` offen (LinkedIn vom Kunden)
- [ ] GitHub Action läuft grün und deployt nach `k-onepager/` auf dem IONOS-Webspace (SFTP, `deploy-ionos.yml`, README → Deployment); Produktion = Domain auf den Ordner zeigen + Livegang-Schritte – 2026-09-14: Workflow angelegt, erster Lauf als Dry-Run (siehe Status-Log)
- [ ] Impressum/Datenschutz mit echten Texten, keine Platzhalter-Mailadressen mehr in `de.json` – Kundenlieferung offen
- [x] `PROJEKT-STRUKTUR.md` „Offene Punkte" aktualisiert
- [x] Commit `chore(phase-8): seo, performance, deploy` (technischer Teil; Rest folgt mit den Kundenlieferungen)
