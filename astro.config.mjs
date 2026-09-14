// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import de from './content/de.json' with { type: 'json' };

// Site and base path. Production (IONOS) serves the site at the root of
// de.json meta.siteUrl (placeholder domain until the client confirms). The
// GitHub Pages preview (.github/workflows/pages.yml) overrides both through
// environment variables:
//   PUBLIC_SITE_URL=https://elkocho1.github.io  PUBLIC_BASE_PATH=/k-onepager
// Unset, the build is the production build. src/lib/paths.ts prefixes every
// public/ path and internal link with the base at render time.
const site = process.env.PUBLIC_SITE_URL || de.meta.siteUrl;
const base = process.env.PUBLIC_BASE_PATH || '/';

// Pages that carry `noindex` stay out of the sitemap: the legal pages until
// their copy exists (content/de.json legal.noindex, read by Legal.astro too)
// and the 404 page. Matched on the end of the path, so the base path does
// not matter.
const legalPaths = Object.keys(de.legal.pages).map((key) => `/${key}/`);
const excluded = ['/404/', ...(de.legal.noindex ? legalPaths : [])];

// https://astro.build/config
export default defineConfig({
  site,
  base,
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) => !excluded.some((path) => new URL(page).pathname.endsWith(path)),
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
});
