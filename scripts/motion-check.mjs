/**
 * Motion acceptance checks (docs/phases/PHASE-7-animationen.md, DoD), run
 * against the preview server in headless Chrome:
 *
 *   nojs     page scripts disabled – every reveal/parallax/marquee target is
 *            fully visible and untransformed, Lenis is off
 *   reduced  prefers-reduced-motion: reduce emulated – same as nojs, plus two
 *            viewport captures 1.5 s apart at the marquee are pixel-identical
 *   js       scripts on – Lenis runs, nav gets .is-scrolled and aria-current,
 *            anchor links land at --scroll-offset with hash + focus, reveals
 *            resolve, marquee moves, hero parallax scrubs, CTA glow pulses,
 *            the card track still scrolls horizontally under the wheel
 *
 *   node scripts/motion-check.mjs <url> [--mode=all|nojs|reduced|js] [--width=1920]
 *                                 [--height=1080] [--timeout=120000]
 *
 * Prints one line per check and exits 1 on any failure. Start the server
 * first, e.g. `npx astro preview --host 127.0.0.1 --port 4321`.
 */
import sharp from 'sharp';
import { parseOptions, withPage } from './lib/cdp.mjs';

const [url, ...rest] = process.argv.slice(2);
if (!url) {
  console.error('usage: node scripts/motion-check.mjs <url> [--mode=all|nojs|reduced|js] [--width=N] [--height=N] [--timeout=ms]');
  process.exit(2);
}
const options = parseOptions(rest);
const width = Number(options.width ?? 1920);
const height = Number(options.height ?? 1080);
const timeout = Number(options.timeout ?? 120_000);
const mode = options.mode ?? 'all';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function check(name, ok, detail = '') {
  failures += ok ? 0 : 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` – ${detail}` : ''}`);
}

/** Every element the motion layer touches must be visible and untransformed. */
const STATIC_PROBE = `(async () => {
  await document.fonts.ready;
  const targets = [...document.querySelectorAll('[data-reveal], [data-reveal-stagger] > *, [data-marquee-track], [data-parallax], [data-glow]')];
  const bad = targets.filter((el) => {
    const cs = getComputedStyle(el);
    return parseFloat(cs.opacity) < 1 || cs.transform !== 'none' || cs.visibility !== 'visible';
  });
  return {
    targets: targets.length,
    bad: bad.map((el) => el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '')),
    lenis: document.documentElement.classList.contains('lenis'),
    scrolled: !!document.querySelector('[data-nav].is-scrolled'),
  };
})()`;

async function staticChecks(page, label) {
  const r = await page.evaluate(STATIC_PROBE);
  check(`${label}: ${r.targets} motion targets visible and untransformed`, r.targets > 0 && r.bad.length === 0, r.bad.join(', '));
  check(`${label}: no Lenis`, !r.lenis);
  return r;
}

async function rawViewport(page) {
  return sharp(await page.screenshot({ viewportOnly: true })).raw().toBuffer();
}

async function runNoJs() {
  await withPage({ width, height, timeout, hideScrollbars: true, disableJs: true }, async (page) => {
    await page.navigate(url);
    await staticChecks(page, 'no-js');
  });
}

async function runReduced() {
  await withPage({ width, height, timeout, hideScrollbars: true, reducedMotion: true }, async (page) => {
    await page.navigate(url);
    const reduce = await page.evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches`);
    check('reduced: media query emulated', reduce === true);
    await staticChecks(page, 'reduced');
    // Marquee in view, two captures 1.5 s apart must be identical
    await page.evaluate(`(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      document.querySelector('[data-marquee]').scrollIntoView({ block: 'center' });
      await new Promise((r) => setTimeout(r, 600));
    })()`);
    const a = await rawViewport(page);
    await sleep(1500);
    const b = await rawViewport(page);
    let diff = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
    check('reduced: marquee static (two captures 1.5 s apart identical)', diff === 0, `${diff} differing bytes`);
    // Nav state is functional, not motion – it must still work
    await page.evaluate(`(async () => { window.scrollTo(0, 300); await new Promise((r) => setTimeout(r, 400)); })()`);
    const scrolled = await page.evaluate(`!!document.querySelector('[data-nav].is-scrolled')`);
    check('reduced: nav .is-scrolled after 300px', scrolled === true);
  });
}

async function runJs() {
  await withPage({ width, height, timeout, hideScrollbars: true }, async (page) => {
    await page.navigate(url);
    await page.evaluate(`document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 600)))`);
    // The harness jumps with native scrollTo/scrollIntoView between steps –
    // keep those instant regardless of the page's scroll-behavior
    await page.evaluate(`document.documentElement.style.scrollBehavior = 'auto'`);
    const wheel = async (x, y, deltaY, deltaX = 0) =>
      page.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX, deltaY });
    const identity = (transform) => transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)';

    const boot = await page.evaluate(`({
      lenis: document.documentElement.classList.contains('lenis'),
      scrolled: !!document.querySelector('[data-nav].is-scrolled'),
      hidden: [...document.querySelectorAll('[data-reveal]')].filter((el) => getComputedStyle(el).opacity === '0').length,
      reveals: document.querySelectorAll('[data-reveal]').length,
      heroTransform: getComputedStyle(document.querySelector('[data-hero] [data-parallax]')).transform,
      glowTransform: getComputedStyle(document.querySelector('[data-glow]')).transform,
      current: document.querySelectorAll('[data-nav] a[aria-current="true"]').length,
    })`);
    check('js: Lenis active (html.lenis)', boot.lenis);
    check('js: nav not scrolled at top', !boot.scrolled);
    check('js: below-fold reveals start hidden', boot.hidden > 0 && boot.hidden <= boot.reveals, `${boot.hidden}/${boot.reveals}`);
    check('js: hero picture starts at scale 1.1', boot.heroTransform.startsWith('matrix(1.1,'), boot.heroTransform);
    check('js: CTA glow pulse running', boot.glowTransform !== 'none', boot.glowTransform);
    check('js: no current nav link on the hero', boot.current === 0);

    // Marquee moves
    const m1 = await page.evaluate(`getComputedStyle(document.querySelector('[data-marquee-track]')).transform`);
    await sleep(500);
    const m2 = await page.evaluate(`getComputedStyle(document.querySelector('[data-marquee-track]')).transform`);
    check('js: marquee moving', m1 !== m2 && m1 !== 'none', `${m1} → ${m2}`);

    // Wheel 8×60 = 480px: nav scrolled, hero parallax progressed, Lenis smoothed
    for (let i = 0; i < 8; i++) {
      await wheel(width / 2, height / 2, 60);
      await sleep(30);
    }
    await sleep(1500);
    const after = await page.evaluate(`({
      y: Math.round(scrollY),
      scrolled: !!document.querySelector('[data-nav].is-scrolled'),
      heroTransform: getComputedStyle(document.querySelector('[data-hero] [data-parallax]')).transform,
    })`);
    check('js: wheel scroll moved the page (Lenis)', after.y > 300 && after.y <= 480, `scrollY ${after.y}`);
    check('js: nav .is-scrolled after 40px', after.scrolled);
    const scale = parseFloat(after.heroTransform.replace('matrix(', ''));
    check('js: hero parallax scrubbed (scale between 1 and 1.1)', scale > 1 && scale < 1.1, after.heroTransform);

    // Reveal resolves once its section is in view (founder text, well below)
    await page.evaluate(`(async () => {
      document.getElementById('founder').scrollIntoView({ block: 'center' });
      await new Promise((r) => setTimeout(r, 1500));
    })()`);
    const founder = await page.evaluate(`({
      opacity: getComputedStyle(document.querySelector('#founder [data-reveal]:last-of-type')).opacity,
      transform: getComputedStyle(document.querySelector('#founder [data-reveal]:last-of-type')).transform,
    })`);
    check('js: reveal completes in view (opacity 1, no offset)', founder.opacity === '1' && identity(founder.transform), JSON.stringify(founder));

    // Current nav link follows the section under the viewport centre
    await page.evaluate(`(async () => {
      document.getElementById('portfolio').scrollIntoView({ block: 'start' });
      window.scrollBy(0, 200);
      await new Promise((r) => setTimeout(r, 500));
    })()`);
    const current = await page.evaluate(`[...document.querySelectorAll('[data-nav] a[aria-current="true"]')].map((a) => a.hash)`);
    check('js: aria-current on the portfolio link', current.length === 1 && current[0] === '#portfolio', current.join(','));

    // Anchor link: hash, focus and --scroll-offset landing
    await page.evaluate(`(async () => {
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 400));
      document.querySelector('[data-nav] nav a[href="#warum-kplus"]').click();
      await new Promise((r) => setTimeout(r, 2500));
    })()`);
    const anchor = await page.evaluate(`({
      top: Math.round(document.getElementById('warum-kplus').getBoundingClientRect().top),
      offset: parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop),
      hash: location.hash,
      focused: document.activeElement?.id,
    })`);
    check('js: anchor lands at --scroll-offset', Math.abs(anchor.top - anchor.offset) <= 1, `top ${anchor.top}, offset ${anchor.offset}`);
    check('js: anchor keeps hash and moves focus', anchor.hash === '#warum-kplus' && anchor.focused === 'warum-kplus', `${anchor.hash} focus=${anchor.focused}`);

    // Card track: horizontal wheel scrolls the track natively (two 400px
    // deltas – a single small delta snaps back to card 1 with scroll-snap
    // mandatory), vertical wheel scrolls the page
    const rect = await page.evaluate(`(() => { const r = document.querySelector('[data-cards]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    for (let i = 0; i < 2; i++) {
      await wheel(Math.round(rect.x), Math.round(rect.y), 0, 400);
      await sleep(400);
    }
    await sleep(600);
    const track = await page.evaluate(`({ left: document.querySelector('[data-cards]').scrollLeft, y: Math.round(scrollY) })`);
    check('js: horizontal wheel scrolls the card track', track.left > 0, `scrollLeft ${track.left}`);
    await wheel(Math.round(rect.x), Math.round(rect.y), 200);
    await sleep(1200);
    const page2 = await page.evaluate(`Math.round(scrollY)`);
    check('js: vertical wheel over the track scrolls the page', page2 > track.y, `${track.y} → ${page2}`);

    // Card glow follows the pointer (hover: hover)
    const hover = await page.evaluate(`matchMedia('(hover: hover)').matches`);
    if (hover) {
      // The first card fully inside the viewport (the wheel test above may have scrolled the track)
      const card = await page.evaluate(`(() => { const el = [...document.querySelectorAll('[data-cards] > *')].find((c) => c.getBoundingClientRect().left >= 0); const r = el.getBoundingClientRect(); return { x: r.left + r.width * 0.9, y: r.top + r.height * 0.9, index: [...el.parentNode.children].indexOf(el) }; })()`);
      await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(card.x), y: Math.round(card.y) });
      await sleep(800);
      const glow = await page.evaluate(`getComputedStyle(document.querySelectorAll('[data-card-glow]')[${card.index}]).transform`);
      check('js: card glow moved toward the pointer', glow !== 'none' && !/matrix\\(1, 0, 0, 1, 0, 0\\)/.test(glow), glow);
    } else {
      console.log('skip  js: card glow (no hover media)');
    }
  });
}

try {
  if (mode === 'all' || mode === 'nojs') await runNoJs();
  if (mode === 'all' || mode === 'reduced') await runReduced();
  if (mode === 'all' || mode === 'js') await runJs();
} catch (error) {
  console.error(error.message);
  failures++;
}
console.log(failures ? `${failures} check(s) failed` : 'all checks passed');
process.exit(failures ? 1 : 0);
