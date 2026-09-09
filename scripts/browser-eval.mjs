/**
 * Evaluates a JavaScript expression in headless Chrome on a page of the
 * running preview server and prints the JSON result – a functional check for
 * the few interactive parts (card slider progress, portfolio switch).
 *
 *   node scripts/browser-eval.mjs <url> "<expression>" [--width=1920] [--height=1080]
 *                                 [--screenshot=file.png] [--screenshot-mode=page|viewport]
 *                                 [--scrollbars=hidden] [--no-js] [--reduced-motion] [--timeout=60000]
 *
 * --screenshot stores a PNG taken after the expression ran (so the expression
 * can switch state first, e.g. click a portfolio tile): the whole page
 * (default) or, with --screenshot-mode=viewport, the current viewport – let
 * the expression scrollTo() the region first. Chrome has hung on full-page
 * captures once large decoded photos were on screen; viewport captures are
 * the safe choice for sections with photos (which only load lazily inside the
 * viewport – wait for img.decode() in the expression), and page-shot.mjs
 * stitches a whole page from them. --scrollbars=hidden removes the classic
 * scrollbar so innerWidth equals the layout width (overflow checks).
 * --no-js disables page scripts, --reduced-motion emulates
 * `prefers-reduced-motion: reduce`. --timeout (ms) kills Chrome and exits 1
 * when exceeded.
 *
 * Talks to Chrome over the DevTools Protocol (scripts/lib/cdp.mjs) with
 * Node's built-in WebSocket, so it needs no extra dependency. Start the
 * server first, e.g. `npx astro preview --host 127.0.0.1 --port 4321`.
 */
import { writeFileSync } from 'node:fs';
import { parseOptions, withPage } from './lib/cdp.mjs';

const [url, expression, ...rest] = process.argv.slice(2);
if (!url || !expression) {
  console.error(
    'usage: node scripts/browser-eval.mjs <url> "<expression>" [--width=N] [--height=N] [--screenshot=file] [--screenshot-mode=page|viewport] [--scrollbars=hidden] [--no-js] [--reduced-motion] [--timeout=ms]',
  );
  process.exit(2);
}
const options = parseOptions(rest);
const width = Number(options.width ?? 1920);
const height = Number(options.height ?? 1080);
const timeout = Number(options.timeout ?? 60_000);

try {
  const emulation = {
    hideScrollbars: options.scrollbars === 'hidden',
    disableJs: options['no-js'] === 'true',
    reducedMotion: options['reduced-motion'] === 'true',
  };
  const failed = await withPage({ width, height, timeout, ...emulation }, async (page) => {
    await page.navigate(url);
    let value;
    try {
      value = await page.evaluate(expression);
    } catch (error) {
      console.log(JSON.stringify(error.details ?? { message: error.message }, null, 2));
      return true;
    }
    console.log(JSON.stringify(value, null, 2));
    if (options.screenshot) {
      writeFileSync(options.screenshot, await page.screenshot({ viewportOnly: options['screenshot-mode'] === 'viewport' }));
      console.error('screenshot: ' + options.screenshot);
    }
    return false;
  });
  process.exit(failed ? 1 : 0);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
