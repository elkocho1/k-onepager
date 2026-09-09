// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import de from './content/de.json' with { type: 'json' };

// https://astro.build/config
export default defineConfig({
  // Placeholder domain until the client confirms – single source: content/de.json
  site: de.meta.siteUrl,
  output: 'static',
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
});
