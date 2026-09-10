/**
 * Scroll performance check (docs/phases/PHASE-7-animationen.md, DoD): wheels
 * through the whole page in headless Chrome and reports main-thread long
 * tasks (> 50 ms, Long Tasks API) during the scroll, layout shifts without
 * recent input (CLS) and – with --trace – writes a DevTools trace (load it in
 * the Performance panel) plus the longest renderer tasks found in it. Long
 * tasks from the page load (before the scroll starts) are listed separately
 * as information; they do not count for the scroll verdict.
 *
 *   node scripts/scroll-perf.mjs <url> [--width=1920] [--height=1080] [--step=120]
 *                                [--interval=30] [--max=px] [--trace=file.json]
 *                                [--reduced-motion] [--timeout=180000]
 *
 * --step is the wheel delta per event (px), --interval the pause between
 * events (ms); with Lenis the wheel input is smoothed anyway. --max stops
 * after that many pixels instead of at the end of the page – with a small
 * --step it samples one stretch densely (e.g. the pinned hero). Exits 1 when a
 * long task > 50 ms or CLS ≥ 0.05 occurred. Start the preview server first,
 * e.g. `npx astro preview --host 127.0.0.1 --port 4321`.
 */
import { writeFileSync } from 'node:fs';
import { parseOptions, withPage } from './lib/cdp.mjs';

const [url, ...rest] = process.argv.slice(2);
if (!url) {
  console.error(
    'usage: node scripts/scroll-perf.mjs <url> [--width=N] [--height=N] [--step=px] [--interval=ms] [--max=px] [--trace=file.json] [--reduced-motion] [--timeout=ms]',
  );
  process.exit(2);
}
const options = parseOptions(rest);
const width = Number(options.width ?? 1920);
const height = Number(options.height ?? 1080);
const step = Number(options.step ?? 120);
const interval = Number(options.interval ?? 30);
const max = Number(options.max ?? Infinity);
const timeout = Number(options.timeout ?? 180_000);

const MAX_TASK = 50; // ms
const MAX_CLS = 0.05;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const observers = `(() => {
  const t0 = performance.now();
  window.__perf = { long: [], load: [], cls: 0, shifts: 0 };
  new PerformanceObserver((list) => {
    list.getEntries().forEach((e) => {
      (e.startTime < t0 ? __perf.load : __perf.long).push({ start: Math.round(e.startTime), duration: Math.round(e.duration) });
    });
  }).observe({ type: 'longtask', buffered: true });
  new PerformanceObserver((list) => {
    list.getEntries().forEach((e) => { if (!e.hadRecentInput) { __perf.cls += e.value; __perf.shifts += 1; } });
  }).observe({ type: 'layout-shift', buffered: true });
  performance.mark('scroll-start');
})()`;

try {
  const failed = await withPage(
    { width, height, timeout, hideScrollbars: true, reducedMotion: options['reduced-motion'] === 'true' },
    async (page) => {
      const events = [];
      if (options.trace) page.on('Tracing.dataCollected', (params) => events.push(...params.value));

      await page.navigate(url);
      await page.evaluate('document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 800)))');

      if (options.trace) {
        await page.send('Tracing.start', {
          categories: 'devtools.timeline,disabled-by-default-devtools.timeline,blink.user_timing',
          transferMode: 'ReportEvents',
        });
      }
      await page.evaluate(observers);

      // Wheel through the page from the top until the scroll position stops growing
      const limit = Math.min(max, await page.evaluate('document.documentElement.scrollHeight - innerHeight'));
      let sent = 0;
      while (sent < limit + step) {
        await page.send('Input.dispatchMouseEvent', {
          type: 'mouseWheel',
          x: Math.round(width / 2),
          y: Math.round(height / 2),
          deltaX: 0,
          deltaY: step,
        });
        sent += step;
        await sleep(interval);
      }
      // Let smooth scrolling settle, then read the observers
      let last = -1;
      for (let i = 0; i < 40; i++) {
        await sleep(200);
        const y = await page.evaluate('Math.round(scrollY)');
        if (y === last) break;
        last = y;
      }
      await sleep(500);
      const perf = await page.evaluate('({ ...__perf, scrollY: Math.round(scrollY), limit: document.documentElement.scrollHeight - innerHeight })');

      let traceTasks = [];
      if (options.trace) {
        const complete = page.once('Tracing.tracingComplete');
        await page.send('Tracing.end');
        await complete;
        writeFileSync(options.trace, JSON.stringify({ traceEvents: events }));
        // Longest renderer main-thread tasks in the trace (µs → ms)
        const mainThreads = new Set(
          events.filter((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain').map((e) => `${e.pid}:${e.tid}`),
        );
        traceTasks = events
          .filter((e) => e.name === 'RunTask' && e.dur && mainThreads.has(`${e.pid}:${e.tid}`))
          .map((e) => Math.round(e.dur / 1000))
          .sort((a, b) => b - a)
          .slice(0, 5);
        console.log(`trace: ${options.trace} (${events.length} events, longest RunTask ms: ${traceTasks.join(', ') || 'none'})`);
      }

      const longest = Math.max(0, ...perf.long.map((t) => t.duration), ...traceTasks);
      if (perf.load.length) {
        console.log(`info: ${perf.load.length} long task(s) during page load, before the scroll: ${perf.load.map((t) => `${t.duration}ms@${t.start}`).join(', ')}`);
      }
      // How far this run meant to go – the whole page, or --max
      const target = Math.min(max, perf.limit);
      console.log(
        `scrolled ${perf.scrollY}/${target}px · long tasks during the scroll: ${perf.long.length}${
          perf.long.length ? ` (${perf.long.map((t) => `${t.duration}ms@${t.start}`).join(', ')})` : ''
        } · CLS ${perf.cls.toFixed(4)} (${perf.shifts} shifts)`,
      );
      const ok = perf.scrollY >= target - 1 && longest <= MAX_TASK && perf.cls < MAX_CLS;
      console.log(ok ? 'OK' : 'FAIL');
      return !ok;
    },
  );
  process.exit(failed ? 1 : 0);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
