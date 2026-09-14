// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import de from './content/de.json' with { type: 'json' };

// https://astro.build/config
// Pages that carry `noindex` stay out of the sitemap: the legal pages until
// their copy exists (content/de.json legal.noindex, read by Legal.astro too)
// and the 404 page.
const legalPaths = Object.keys(de.legal.pages).map((key) => `/${key}/`);
const excluded = new Set(['/404/', ...(de.legal.noindex ? legalPaths : [])]);

export default defineConfig({
  // Placeholder domain until the client confirms – single source: content/de.json
  site: de.meta.siteUrl,
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) => !excluded.has(new URL(page).pathname),
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
});
