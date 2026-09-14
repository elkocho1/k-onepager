/**
 * Base-path aware URLs.
 *
 * Astro rewrites its own output for `base` (astro:assets pictures, bundled
 * CSS and JS, url() inside CSS), but not paths written into templates: files
 * in public/ (fonts, logos, favicon, video, OG image) and internal links from
 * content/de.json. `withBase()` prefixes those. Anchors (#id), mailto:,
 * absolute and protocol-relative URLs pass through unchanged.
 *
 * The base is '/' in production and '/k-onepager' on the GitHub Pages
 * preview (astro.config.mjs, PUBLIC_BASE_PATH).
 */

// Astro's BASE_URL is the configured base ('/', '/k-onepager' or, with a
// trailing slash, '/k-onepager/') – normalised to '' or '/k-onepager'
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export function withBase(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  return `${BASE}${path}`;
}

/** The start page: '/' in production, '/k-onepager/' on the preview. */
export const home = `${BASE}/`;

/**
 * True for the GitHub Pages preview build (PUBLIC_PREVIEW=true in
 * .github/workflows/pages.yml): every page is marked noindex, nofollow.
 */
export const isPreview = import.meta.env.PUBLIC_PREVIEW === 'true';
