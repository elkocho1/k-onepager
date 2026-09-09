/**
 * Full-page screenshot of a page on the running preview server with all
 * (lazy) images loaded and decoded – stitched from viewport captures, because
 * Chrome's full-page capture hangs once large decoded photos are on screen
 * (see browser-eval.mjs).
 *
 *   node scripts/page-shot.mjs <url> <out.png> [--width=1920] [--height=1080]
 *                              [--scrollbars=hidden] [--no-js] [--reduced-motion] [--timeout=120000]
 *
 * --no-js disables page scripts (proves the page is complete without them),
 * --reduced-motion emulates `prefers-reduced-motion: reduce`.
 * The fixed header is hidden on every slice but the first. All waiting
 * happens on the Node side: with scripts disabled, timers inside the page
 * never fire, so the page snippets stay synchronous. Start the server first,
 * e.g. `npx astro preview --host 127.0.0.1 --port 4321`.
 */
import sharp from 'sharp';
import { parseOptions, withPage } from './lib/cdp.mjs';

const [url, out, ...rest] = process.argv.slice(2);
if (!url || !out) {
  console.error(
    'usage: node scripts/page-shot.mjs <url> <out.png> [--width=N] [--height=N] [--scrollbars=hidden] [--no-js] [--reduced-motion] [--timeout=ms]',
  );
  process.exit(2);
}
const options = parseOptions(rest);
const width = Number(options.width ?? 1920);
const height = Number(options.height ?? 1080);
const timeout = Number(options.timeout ?? 120_000);
const emulation = {
  hideScrollbars: options.scrollbars === 'hidden',
  disableJs: options['no-js'] === 'true',
  reducedMotion: options['reduced-motion'] === 'true',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const IN_VIEW = `[...document.images].filter((i) => { const r = i.getBoundingClientRect(); return r.bottom > -200 && r.top < innerHeight + 200; })`;

const prepare = (y) => `(() => {
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(0, ${y});
  const header = document.querySelector('header');
  if (header) header.style.visibility = ${y} > 0 ? 'hidden' : '';
  return { scrollY: Math.round(scrollY), pageHeight: document.documentElement.scrollHeight };
})()`;
const pending = `${IN_VIEW}.filter((i) => !(i.complete && i.naturalWidth > 0)).length`;
const decode = `Promise.all(${IN_VIEW}.map((i) => i.decode().catch(() => null))).then(() => true)`;

try {
  await withPage({ width, height, timeout, ...emulation }, async (page) => {
    await page.navigate(url);
    // Lazy images only load near the viewport – make them eager so each
    // slice just has to wait for loading and decoding.
    let pageHeight = await page.evaluate(
      `(() => { document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; }); return document.documentElement.scrollHeight; })()`,
    );

    const slices = [];
    for (let y = 0; y < pageHeight; y += height) {
      const info = await page.evaluate(prepare(y));
      pageHeight = info.pageHeight;
      const t0 = Date.now();
      while ((await page.evaluate(pending)) > 0 && Date.now() - t0 < 8000) await sleep(100);
      if (!emulation.disableJs) await page.evaluate(decode);
      await sleep(300);
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
