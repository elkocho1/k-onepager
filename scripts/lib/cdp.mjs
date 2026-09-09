/**
 * Minimal DevTools-Protocol helper shared by browser-eval.mjs and
 * page-shot.mjs: launches headless Chrome/Edge with a throw-away profile,
 * opens one page at the requested viewport and hands a small page API to the
 * callback. Uses Node's built-in WebSocket – no extra dependency.
 *
 * Chrome picks a free debugging port (read from the profile's
 * DevToolsActivePort file), so several runs can overlap without colliding.
 * The watchdog (`timeout`, ms) kills Chrome and exits 1 when a run hangs.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];

export function findChrome() {
  return CHROME_CANDIDATES.find((c) => c && existsSync(c));
}

/** Parses `--key=value` arguments into an object (`--flag` → "true"). */
export function parseOptions(args) {
  return Object.fromEntries(args.map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? 'true']));
}

async function waitForPort(profile, ms) {
  const file = path.join(profile, 'DevToolsActivePort');
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (existsSync(file)) {
      const port = Number(readFileSync(file, 'utf8').split('\n')[0]);
      if (port) return port;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('Chrome did not open a DevTools port');
}

async function pageTarget(port) {
  for (let i = 0; i < 50; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('DevTools target not found');
}

/**
 * `disableJs` turns page scripts off (Emulation.setScriptExecutionDisabled –
 * Runtime.evaluate keeps working), `reducedMotion` emulates
 * `prefers-reduced-motion: reduce`.
 *
 * @param {{ width?: number, height?: number, timeout?: number, hideScrollbars?: boolean, disableJs?: boolean, reducedMotion?: boolean }} options
 * @param {(page: {
 *   send: (method: string, params?: object) => Promise<any>,
 *   on: (method: string, handler: (params: any) => void) => void,
 *   once: (method: string) => Promise<any>,
 *   navigate: (url: string) => Promise<void>,
 *   evaluate: (expression: string) => Promise<any>,
 *   screenshot: (options?: { viewportOnly?: boolean }) => Promise<Buffer>,
 * }) => Promise<T>} run
 * @returns {Promise<T>}
 * @template T
 */
export async function withPage(
  { width = 1920, height = 1080, timeout = 60_000, hideScrollbars = false, disableJs = false, reducedMotion = false },
  run,
) {
  const chrome = findChrome();
  if (!chrome) throw new Error('No Chrome/Edge found – set CHROME_PATH.');

  const profile = mkdtempSync(path.join(tmpdir(), 'kplus-eval-'));
  const browser = spawn(
    chrome,
    [
      '--headless',
      `--user-data-dir=${profile}`,
      '--remote-debugging-port=0',
      '--remote-debugging-address=127.0.0.1',
      '--no-proxy-server',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      ...(hideScrollbars ? ['--hide-scrollbars'] : []),
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

  const watchdog = setTimeout(async () => {
    console.error(`timeout after ${timeout} ms`);
    await cleanup();
    process.exit(1);
  }, timeout);

  let ws;
  try {
    const port = await waitForPort(profile, 15_000);
    ws = new WebSocket(await pageTarget(port));
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
    if (disableJs) await send('Emulation.setScriptExecutionDisabled', { value: true });
    if (reducedMotion) {
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    }

    const page = {
      send,
      /** Subscribes to a protocol event (one handler per method). */
      on(method, handler) {
        listeners.set(method, handler);
      },
      once,
      async navigate(url) {
        const loaded = once('Page.loadEventFired');
        await send('Page.navigate', { url });
        await loaded;
      },
      /** Evaluates an expression (promises are awaited); throws on a page exception. */
      async evaluate(expression) {
        const { result } = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        if (result.exceptionDetails) {
          const error = new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
          error.details = result.exceptionDetails;
          throw error;
        }
        return result.result?.value;
      },
      /** PNG of the whole page, or of the current viewport with `viewportOnly`. */
      async screenshot({ viewportOnly = false } = {}) {
        const { result } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !viewportOnly });
        return Buffer.from(result.data, 'base64');
      },
    };
    return await run(page);
  } finally {
    clearTimeout(watchdog);
    ws?.close();
    await cleanup();
  }
}
