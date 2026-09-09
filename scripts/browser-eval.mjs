/**
 * Evaluates a JavaScript expression in headless Chrome on a page of the
 * running preview server and prints the JSON result – a functional check for
 * the few interactive parts (card slider progress, portfolio switch).
 *
 *   node scripts/browser-eval.mjs <url> "<expression>" [--width=1920] [--height=1080]
 *                                 [--screenshot=file.png] [--screenshot-mode=page|viewport]
 *                                 [--timeout=60000]
 *
 * --screenshot stores a PNG taken after the expression ran (so the expression
 * can switch state first, e.g. click a portfolio tile): the whole page
 * (default) or, with --screenshot-mode=viewport, the current viewport – let
 * the expression scrollTo() the region first. Chrome has hung on full-page
 * captures once large decoded photos were on screen; viewport captures are
 * the safe choice for sections with photos (which only load lazily inside the
 * viewport – wait for img.decode() in the expression). --timeout (ms) kills
 * Chrome and exits 1 when exceeded.
 *
 * Talks to Chrome over the DevTools Protocol with Node's built-in WebSocket,
 * so it needs no extra dependency. Start the server first, e.g.
 * `npx astro preview --host 127.0.0.1 --port 4321`.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const [url, expression, ...rest] = process.argv.slice(2);
if (!url || !expression) {
  console.error('usage: node scripts/browser-eval.mjs <url> "<expression>" [--width=N] [--height=N] [--screenshot=file]');
  process.exit(2);
}
const options = Object.fromEntries(rest.map((a) => a.replace(/^--/, '').split('=')));
const width = Number(options.width ?? 1920);
const height = Number(options.height ?? 1080);
const timeoutMs = Number(options.timeout ?? 60_000);

const chrome = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find((c) => c && existsSync(c));
if (!chrome) {
  console.error('No Chrome/Edge found – set CHROME_PATH.');
  process.exit(1);
}

const PORT = 9333;
const profile = mkdtempSync(path.join(tmpdir(), 'kplus-eval-'));
const browser = spawn(
  chrome,
  [
    '--headless',
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${PORT}`,
    '--remote-debugging-address=127.0.0.1',
    '--no-proxy-server',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

async function cleanup() {
  if (browser.exitCode === null) {
    const exited = new Promise((resolve) => browser.once('exit', resolve));
    browser.kill();
    await exited;
  }
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {
    /* Chrome may still hold the profile for a moment – leave the temp dir */
  }
}

async function pageTarget() {
  for (let i = 0; i < 50; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('DevTools target not found');
}

const watchdog = setTimeout(async () => {
  console.error(`timeout after ${timeoutMs} ms`);
  await cleanup();
  process.exit(1);
}, timeoutMs);

try {
  const ws = new WebSocket(await pageTarget());
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let nextId = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.onmessage = (message) => {
    const msg = JSON.parse(message.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method && listeners.has(msg.method)) {
      listeners.get(msg.method)(msg.params);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = ++nextId;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const once = (method) => new Promise((resolve) => listeners.set(method, resolve));

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url });
  await loaded;

  const { result } = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  const failed = Boolean(result.exceptionDetails);
  console.log(JSON.stringify(failed ? result.exceptionDetails : result.result?.value, null, 2));
  if (options.screenshot && !failed) {
    const viewportOnly = options['screenshot-mode'] === 'viewport';
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !viewportOnly });
    writeFileSync(options.screenshot, Buffer.from(shot.result.data, 'base64'));
    console.error('screenshot: ' + options.screenshot);
  }
  ws.close();
  clearTimeout(watchdog);
  await cleanup();
  process.exit(failed ? 1 : 0);
} catch (error) {
  console.error(error.message);
  await cleanup();
  process.exit(1);
}
