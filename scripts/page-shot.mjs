/**
 * Full-page screenshot of a page on the running preview server with all
 * (lazy) images loaded and decoded – stitched from viewport captures, because
 * Chrome's full-page capture hangs once large decoded photos are on screen
 * (see browser-eval.mjs).
 *
 *   node scripts/page-shot.mjs <url> <out.png> [--width=1920] [--height=1080]
 *                              [--scrollbars=hidden] [--timeout=120000]
 *
 * The fixed header is hidden on every slice but the first. Start the server
 * first, e.g. `npx astro preview --host 127.0.0.1 --port 4321`.
 */
import sharp from 'sharp';
import { parseOptions, withPage } from './lib/cdp.mjs';

const [url, out, ...rest] = process.argv.slice(2);
if (!url || !out) {
  console.error('usage: node scripts/page-shot.mjs <url> <out.png> [--width=N] [--height=N] [--scrollbars=hidden] [--timeout=ms]');
  process.exit(2);
}
const options = parseOptions(rest);
const width = Number(options.width ?? 1920);
const height = Number(options.height ?? 1080);
const timeout = Number(options.timeout ?? 120_000);

const sliceScript = (y) => `(async () => {
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(0, ${y});
  const header = document.querySelector('header');
  if (header) header.style.visibility = ${y} > 0 ? 'hidden' : '';
  const imgs = [...document.images].filter((i) => {
    const r = i.getBoundingClientRect();
    return r.bottom > -200 && r.top < innerHeight + 200;
  });
  const t0 = Date.now();
  while (imgs.some((i) => !(i.complete && i.naturalWidth > 0)) && Date.now() - t0 < 8000) {
    await new Promise((r) => setTimeout(r, 100));
  }
  await Promise.all(imgs.map((i) => i.decode().catch(() => null)));
  await new Promise((r) => setTimeout(r, 250));
  return { scrollY: Math.round(scrollY), pageHeight: document.documentElement.scrollHeight };
})()`;

try {
  await withPage({ width, height, timeout, hideScrollbars: options.scrollbars === 'hidden' }, async (page) => {
    await page.navigate(url);
    // Lazy images only load near the viewport – make them eager so each
    // slice just has to wait for decoding.
    let pageHeight = await page.evaluate(
      `(() => { document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; }); return document.documentElement.scrollHeight; })()`,
    );

    const slices = [];
    for (let y = 0; y < pageHeight; y += height) {
      const info = await page.evaluate(sliceScript(y));
      pageHeight = info.pageHeight;
      slices.push({ top: info.scrollY, png: await page.screenshot({ viewportOnly: true }) });
      if (info.scrollY + height >= pageHeight) break;
    }

    const total = slices.at(-1).top + height;
    await sharp({ create: { width, height: total, channels: 3, background: '#2a3233' } })
      .composite(slices.map((s) => ({ input: s.png, top: s.top, left: 0 })))
      .png()
      .toFile(out);
    console.log(`${out} (${width}×${total}, ${slices.length} slices, page ${pageHeight}px)`);
  });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
