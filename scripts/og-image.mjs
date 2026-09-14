/**
 * Renders the Open Graph image (docs/phases/PHASE-8-seo-deploy.md, item 3):
 * fills scripts/og.html with the hero copy from content/de.json, the fonts
 * and the logo as data URIs (headless Chrome refuses file:// fonts otherwise),
 * screenshots it at 1200×630 in headless Chrome (scripts/lib/cdp.mjs) and
 * writes public/og/kplus-build-beyond.jpg (the path in de.json meta.ogImage).
 *
 *   node scripts/og-image.mjs [--png=docs/screens/og.png]
 *
 * Run after `npm run subset-fonts` (the fonts come from public/fonts/).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { parseOptions, withPage } from './lib/cdp.mjs';

const WIDTH = 1200;
const HEIGHT = 630;
const JPEG_QUALITY = 84;

const options = parseOptions(process.argv.slice(2));
const root = process.cwd();
const de = JSON.parse(readFileSync(path.join(root, 'content', 'de.json'), 'utf8'));
const target = path.join(root, 'public', de.meta.ogImage);

const dataUri = (file, type) => `data:${type};base64,${readFileSync(file).toString('base64')}`;
const font = (cut) => dataUri(path.join(root, 'public', 'fonts', `KMR-Apparat-${cut}.woff2`), 'font/woff2');
const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const [word1, word2] = de.hero.headline;
// footer.claim reads "Kplus GmbH — <claim>": the image shows the claim alone
const claim = de.footer.claim.split(' — ').pop();

const fills = {
  fontRegular: font('Regular'),
  fontBold: font('Bold'),
  fontHeavy: font('Heavy'),
  logo: dataUri(path.join(root, 'public', de.nav.logo), 'image/png'),
  eyebrow: escape(de.hero.eyebrow),
  word1: escape(word1),
  word2: escape(word2),
  claim: escape(claim),
};
const html = readFileSync(path.join(root, 'scripts', 'og.html'), 'utf8').replace(/\{\{(\w+)\}\}/g, (_, key) => {
  if (!(key in fills)) throw new Error(`og.html: unknown placeholder {{${key}}}`);
  return fills[key];
});

const page = path.join(tmpdir(), `kplus-og-${process.pid}.html`);
writeFileSync(page, html);

const png = await withPage({ width: WIDTH, height: HEIGHT, timeout: 60_000, hideScrollbars: true }, async (p) => {
  await p.navigate(pathToFileURL(page).href);
  await p.evaluate('document.fonts.ready.then(() => document.fonts.size)');
  const loaded = await p.evaluate(`[...document.fonts].map((f) => f.weight + ':' + f.status).join(' ')`);
  if (!/loaded/.test(loaded)) throw new Error(`fonts did not load: ${loaded}`);
  return p.screenshot({ viewportOnly: true });
});

mkdirSync(path.dirname(target), { recursive: true });
await sharp(png).jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(target);
if (options.png) {
  mkdirSync(path.dirname(path.resolve(options.png)), { recursive: true });
  writeFileSync(options.png, png);
}
const { width, height } = await sharp(target).metadata();
const kb = (readFileSync(target).length / 1024).toFixed(1);
console.log(`${path.relative(root, target)} ${width}×${height}, ${kb} kB`);
