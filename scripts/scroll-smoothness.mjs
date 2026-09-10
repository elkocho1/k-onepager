/**
 * Scroll smoothness (docs/phases/PHASE-7-animationen.md): does the page keep
 * creeping after the wheel stops?
 *
 * Two measurements of the same moment, so a finding is never one tool's
 * artefact:
 *   1. a CDP screencast of the scroll – frame to frame difference of one
 *      region, so "the picture still changes" is measured, not inferred;
 *   2. a rAF recorder inside the page – position of a probe element per frame,
 *      which shows the step size the screencast can only hint at.
 *
 * Lenis eases every scroll to a stop by design (lerp), so the scroll offset
 * always has a short tail. The artefact to hunt is the *second* smoothing
 * pass: frames in which the probe still moves although the scroll has already
 * stopped ("lag"), plus runs of sub-pixel steps alternating with stillness
 * (less than CREEP_STEP px per frame with stillness in between).
 *
 *   node scripts/scroll-smoothness.mjs <url> [--width=1920] [--height=1080]
 *        [--probe='[data-hero-text-line]'] [--to=1620] [--step=120] [--settle=2500]
 *        [--no-video] [--label=scrub-true] [--frames=docs/screens/<name>.json]
 *
 * `--no-video` blocks the hero video file (Network.setBlockedURLs) to tell a
 * decoding cost apart from a smoothing artefact. Start the preview server
 * first.
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { parseOptions, withPage } from './lib/cdp.mjs';

const [url, ...rest] = process.argv.slice(2);
if (!url) {
  console.error(
    "usage: node scripts/scroll-smoothness.mjs <url> [--width=N] [--height=N] [--probe='sel'] [--to=N] [--step=N] [--settle=ms] [--no-video] [--label=name] [--frames=file.json]",
  );
  process.exit(2);
}
const options = parseOptions(rest);
const width = Number(options.width ?? 1920);
const height = Number(options.height ?? 1080);
const probe = options.probe ?? '[data-hero-text-line]';
const to = Number(options.to ?? 1620);
const step = Number(options.step ?? 120);
const settle = Number(options.settle ?? 2500);
const label = options.label ?? 'run';
const noVideo = options['no-video'] === 'true';

/** A step this small is a sub-pixel crawl, not a scroll. */
const CREEP_STEP = 1.9;
/** That many frames in a row make it a visible creep rather than one late frame. */
const CREEP_RUN = 6;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Mean absolute channel difference of two raw buffers, 0..255. */
function meanDiff(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

/**
 * Length of the crawl phase: from the first sub-pixel step to the last frame
 * that still moves at all. Trailing stillness does not count – the artefact is
 * the stretch where the picture keeps changing by less than a pixel, with
 * stillness in between, not the stillness that follows it.
 */
function creepRun(steps) {
  const first = steps.findIndex((d) => d > 0 && d < CREEP_STEP);
  if (first < 0) return 0;
  const last = steps.reduce((at, d, i) => (d > 0 ? i : at), -1);
  return last >= first ? last - first + 1 : 0;
}

await withPage({ width, height, timeout: 180_000, hideScrollbars: true }, async (page) => {
  if (noVideo) {
    await page.send('Network.enable');
    await page.send('Network.setBlockedURLs', { urls: ['*/video/*'] });
  }
  await page.navigate(url);
  await page.evaluate('document.fonts.ready');
  await page.evaluate(`(async () => {
    const v = document.querySelector('[data-hero-video]');
    if (v && ${!noVideo}) for (let i = 0; i < 60 && v.currentTime === 0; i++) await new Promise((r) => setTimeout(r, 100));
    document.documentElement.style.scrollBehavior = 'auto';
  })()`);
  await sleep(500);

  // The page records its own frames: probe position and scroll offset per rAF
  await page.evaluate(`(() => {
    window.__frames = [];
    const el = document.querySelector(${JSON.stringify(probe)});
    const tick = () => {
      window.__frames.push([+performance.now().toFixed(1), +scrollY.toFixed(2), +el.getBoundingClientRect().top.toFixed(2)]);
      window.__raf = requestAnimationFrame(tick);
    };
    tick();
  })()`);

  // Screencast of the same stretch
  const frames = [];
  page.on('Page.screencastFrame', ({ data, sessionId, metadata }) => {
    frames.push({ data, t: metadata.timestamp });
    page.send('Page.screencastFrameAck', { sessionId });
  });
  await page.send('Page.startScreencast', { format: 'jpeg', quality: 100, everyNthFrame: 1 });

  // Wheel down to `to`, then let go and watch
  const steps = Math.ceil(to / step);
  for (let i = 0; i < steps; i++) {
    await page.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x: Math.round(width / 2),
      y: Math.round(height / 2),
      deltaX: 0,
      deltaY: step,
    });
    await sleep(30);
  }
  const released = frames.length;
  await sleep(settle);
  await page.send('Page.stopScreencast');
  const recorded = await page.evaluate('cancelAnimationFrame(window.__raf), window.__frames');

  // --- 1. screencast: difference of the probe region, frame to frame --------
  const region = await page.evaluate(`(() => {
    const b = document.querySelector(${JSON.stringify(probe)}).getBoundingClientRect();
    return { left: Math.max(0, Math.round(b.left)), top: Math.max(0, Math.round(b.top) - 40), width: Math.round(b.width), height: Math.round(b.height) + 80 };
  })()`);
  const after = frames.slice(Math.max(0, released - 2));
  let previous = null;
  const diffs = [];
  for (const frame of after) {
    const raw = await sharp(Buffer.from(frame.data, 'base64'))
      .extract({
        left: region.left,
        top: Math.min(region.top, height - region.height - 1),
        width: Math.min(region.width, width - region.left),
        height: Math.min(region.height, height - 1),
      })
      .raw()
      .toBuffer();
    if (previous) diffs.push(+meanDiff(previous, raw).toFixed(4));
    previous = raw;
  }
  const changing = diffs.filter((d) => d > 0).length;
  const lastChange = diffs.reduce((last, d, i) => (d > 0 ? i : last), -1);

  // --- 2. rAF recorder: how far the probe moves per frame -------------------
  // Two series: the scroll offset (Lenis' own easing, which always glides to a
  // stop) and the probe (the timeline on top of it). What a second smoothing
  // pass adds is the stretch where the probe still moves although the scroll
  // has already stopped - that is the number to drive to zero.
  const tail = recorded.slice(recorded.findIndex((f) => f[1] >= to - step) + 1);
  const scrollSteps = tail.slice(1).map((f, i) => +Math.abs(f[1] - tail[i][1]).toFixed(2));
  const moves = tail.slice(1).map((f, i) => +Math.abs(f[2] - tail[i][2]).toFixed(2));
  const creep = creepRun(moves);
  const settledAfter = moves.reduce((last, d, i) => (d > 0 ? i : last), -1);
  const scrollSettled = scrollSteps.reduce((last, d, i) => (d > 0 ? i : last), -1);
  const lag = Math.max(0, settledAfter - scrollSettled);
  const frameMs = tail.length > 1 ? (tail[tail.length - 1][0] - tail[0][0]) / (tail.length - 1) : 0;

  if (options.frames) {
    writeFileSync(
      options.frames,
      JSON.stringify({ label, probe, region, scrollSteps, moves, diffs, recorded: tail }, null, 1),
    );
  }

  const ok = lag < CREEP_RUN && creep < CREEP_RUN;
  console.log(
    [
      `${label}${noVideo ? ' (video blocked)' : ''}: ${frames.length} screencast frames, ${tail.length} rAF frames (${frameMs.toFixed(1)} ms apart)`,
      `  screencast: ${changing}/${diffs.length} frames after the wheel still differ, last change at frame ${lastChange + 1}`,
      `  scroll:     stops at frame ${scrollSettled + 1} (${((scrollSettled + 1) * frameMs).toFixed(0)} ms) - Lenis' own easing`,
      `  probe:      stops at frame ${settledAfter + 1} (${((settledAfter + 1) * frameMs).toFixed(0)} ms), sub-pixel run ${creep} frames`,
      `  lag:        ${lag} frames (${(lag * frameMs).toFixed(0)} ms) of movement after the scroll had stopped`,
      `  scroll px:  ${scrollSteps.slice(0, 40).join(' ')}`,
      `  probe px:   ${moves.slice(0, 40).join(' ')}`,
      `  ${ok ? 'OK' : 'CREEP'} (limit ${CREEP_RUN} frames of lag or sub-pixel run)`,
    ].join('\n'),
  );
  if (!ok) process.exitCode = 1;
});
