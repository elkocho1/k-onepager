/**
 * Motion acceptance checks (docs/phases/PHASE-7-animationen.md, DoD), run
 * against the preview server in headless Chrome:
 *
 *   nojs     page scripts disabled – every motion target (reveals, parallax,
 *            marquee, hero letters, cards, tiles) is fully visible and
 *            untransformed, Lenis is off, the hex canvas stays hidden
 *   reduced  prefers-reduced-motion: reduce emulated – same as nojs, plus two
 *            viewport captures 1.5 s apart at the marquee are pixel-identical
 *            and a spotlight switch happens instantly
 *   js       scripts on – Lenis runs, nav gets .is-scrolled and aria-current,
 *            hero letters settle after the intro while eyebrow, copy and
 *            buttons wait hidden behind the scroll hint, the pinned
 *            push-through scales the type out of its centre while photo and
 *            night overlay follow, and the three blocks rise in afterwards,
 *            anchor links land at --scroll-offset with hash + focus, reveals
 *            resolve, marquee moves, CTA glow pulses,
 *            the card track scrolls horizontally under the wheel with the
 *            progress line easing, logo tiles settle, the spotlight
 *            cross-fades to exactly one panel at a stable height (also under
 *            rapid clicks), the hex lattice shows around the mouse
 *
 *   node scripts/motion-check.mjs <url> [--mode=all|nojs|reduced|js] [--width=1920]
 *                                 [--height=1080] [--timeout=150000]
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
const timeout = Number(options.timeout ?? 150_000);
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
  const targets = [...document.querySelectorAll('[data-reveal], [data-reveal-stagger] > *, [data-marquee-track], [data-parallax], [data-glow], [data-hero-content], [data-hero-char], [data-hero-push], [data-hero-eyebrow], [data-hero-text], [data-hero-text-line], [data-hero-actions], [data-hero-hint], [data-cards] > *, [data-portfolio-tabs] > *')];
  const bad = targets.filter((el) => {
    const cs = getComputedStyle(el);
    return parseFloat(cs.opacity) < 1 || cs.transform !== 'none' || cs.visibility !== 'visible';
  });
  const hex = document.querySelector('[data-hex-cursor]');
  const overlay = document.querySelector('[data-hero-overlay]');
  const pinSpacer = document.querySelector('.pin-spacer');
  return {
    targets: targets.length,
    bad: bad.map((el) => el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '')),
    lenis: document.documentElement.classList.contains('lenis'),
    scrolled: !!document.querySelector('[data-nav].is-scrolled'),
    hexHidden: hex ? hex.hidden && getComputedStyle(hex).display === 'none' : null,
    // The hero push-through must leave nothing behind: night overlay clear,
    // hero unpinned, so the section is the plain photo it is in the design
    heroOverlay: overlay ? getComputedStyle(overlay).opacity : null,
    heroPinned: !!pinSpacer,
  };
})()`;

/** Spotlight state: shown panels (indices), their opacity, inner transforms, container height. */
const PANELS = `(() => {
  const panels = [...document.querySelectorAll('[data-portfolio-panels] > *')];
  const shown = panels.map((p, i) => [p, i]).filter(([p]) => !p.hidden);
  const identity = (t) => t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
  return {
    height: Math.round(document.querySelector('[data-portfolio-panels]').getBoundingClientRect().height * 10) / 10,
    shown: shown.map(([, i]) => i),
    opacity: shown.map(([p]) => +getComputedStyle(p).opacity),
    settled: shown.every(([p]) => identity(getComputedStyle(p.querySelector('[data-spot-media]')).transform) && [...p.querySelector('[data-spot-text]').children].every((c) => identity(getComputedStyle(c).transform))),
    selected: [...document.querySelectorAll('[data-portfolio-tabs] [role="tab"]')].findIndex((t) => t.getAttribute('aria-selected') === 'true'),
  };
})()`;

const clickTab = (index) => `document.querySelectorAll('[data-portfolio-tabs] [role="tab"]')[${index}].click()`;

async function staticChecks(page, label) {
  const r = await page.evaluate(STATIC_PROBE);
  check(`${label}: ${r.targets} motion targets visible and untransformed`, r.targets > 0 && r.bad.length === 0, r.bad.join(', '));
  check(`${label}: no Lenis`, !r.lenis);
  check(`${label}: hex canvas hidden`, r.hexHidden === true, r.hexHidden === null ? 'no canvas element' : '');
  check(`${label}: hero night overlay clear`, r.heroOverlay === '0', `opacity ${r.heroOverlay}`);
  check(`${label}: hero not pinned`, r.heroPinned === false);
  return r;
}

async function rawViewport(page) {
  return sharp(await page.screenshot({ viewportOnly: true })).raw().toBuffer();
}

async function runNoJs() {
  await withPage({ width, height, timeout, hideScrollbars: true, disableJs: true }, async (page) => {
    await page.navigate(url);
    await staticChecks(page, 'no-js');
    const h1 = await page.evaluate(`document.querySelector('h1').innerText.replace(/\\s+/g, ' ').trim()`);
    check('no-js: h1 reads as plain text (hidden copy + letters)', h1.includes('Build Beyond.'), h1);
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
    // Spotlight switches without a fade
    const instant = await page.evaluate(`(() => { ${clickTab(1)}; return ${PANELS}; })()`);
    check('reduced: spotlight switches instantly (one panel, no fade)', instant.shown.length === 1 && instant.shown[0] === 1 && instant.opacity[0] === 1 && instant.selected === 1, JSON.stringify(instant));
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
    check('js: hero picture starts unscaled', identity(boot.heroTransform), boot.heroTransform);
    check('js: CTA glow pulse running', boot.glowTransform !== 'none', boot.glowTransform);
    check('js: no current nav link on the hero', boot.current === 0);

    // Marquee moves
    const m1 = await page.evaluate(`getComputedStyle(document.querySelector('[data-marquee-track]')).transform`);
    await sleep(500);
    const m2 = await page.evaluate(`getComputedStyle(document.querySelector('[data-marquee-track]')).transform`);
    check('js: marquee moving', m1 !== m2 && m1 !== 'none', `${m1} → ${m2}`);

    // Hero intro (letters 0.03 s apart + 0.8 s) has settled – and it is the
    // only thing on screen: eyebrow, copy and buttons wait for the reveal,
    // the scroll hint says so
    await sleep(1400);
    const intro = await page.evaluate(`(() => {
      const chars = [...document.querySelectorAll('[data-hero-char]')];
      const settled = (el) => { const cs = getComputedStyle(el); return cs.opacity === '1' && (cs.transform === 'none' || cs.transform === 'matrix(1, 0, 0, 1, 0, 0)'); };
      const late = ['[data-hero-eyebrow]', '[data-hero-text]', '[data-hero-actions]'].map((s) => +getComputedStyle(document.querySelector(s)).opacity);
      return {
        chars: chars.length,
        unsettled: chars.filter((el) => !settled(el)).length,
        late,
        hint: +getComputedStyle(document.querySelector('[data-hero-hint]')).opacity,
      };
    })()`);
    check('js: hero letters settled after the intro', intro.chars > 0 && intro.unsettled === 0, JSON.stringify(intro));
    check('js: eyebrow, copy and buttons hidden on load', intro.late.every((o) => o === 0), JSON.stringify(intro.late));
    check('js: scroll hint visible on load', intro.hint === 1, `opacity ${intro.hint}`);

    // Wheel 8×60 = 480px into the pinned hero: nav scrolled, the type flies
    // through, photo and overlay follow, the buttons stay put, Lenis smoothed
    for (let i = 0; i < 8; i++) {
      await wheel(width / 2, height / 2, 60);
      await sleep(30);
    }
    await sleep(1500);
    const after = await page.evaluate(`(() => {
      const matrix = (el) => { const t = getComputedStyle(el).transform; return t === 'none' ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(t); };
      return {
        y: Math.round(scrollY),
        scrolled: !!document.querySelector('[data-nav].is-scrolled'),
        heroTop: Math.round(document.querySelector('[data-hero]').getBoundingClientRect().top),
        typeScale: Math.round(matrix(document.querySelector('[data-hero-type]')).a * 100) / 100,
        pictureScale: Math.round(matrix(document.querySelector('[data-hero] [data-parallax]')).a * 1000) / 1000,
        overlay: +getComputedStyle(document.querySelector('[data-hero-overlay]')).opacity,
        hint: +getComputedStyle(document.querySelector('[data-hero-hint]')).opacity,
        late: ['[data-hero-eyebrow]', '[data-hero-text]', '[data-hero-actions]'].map((s) => +getComputedStyle(document.querySelector(s)).opacity),
      };
    })()`);
    check('js: wheel scroll moved the page (Lenis)', after.y > 300 && after.y <= 480, `scrollY ${after.y}`);
    check('js: nav .is-scrolled after 40px', after.scrolled);
    check('js: hero stays pinned during the push-through', after.heroTop === 0, `top ${after.heroTop}`);
    check('js: hero type scales up out of its centre', after.typeScale > 1 && after.typeScale < 8, `scale ${after.typeScale}`);
    check('js: hero photo widens slightly with it', after.pictureScale > 1 && after.pictureScale < 1.12, `scale ${after.pictureScale}`);
    check('js: night overlay darkens the frame', after.overlay > 0 && after.overlay < 1, `opacity ${after.overlay}`);
    check('js: scroll hint gone once the page moves', after.hint === 0, `opacity ${after.hint}`);
    check('js: eyebrow, copy and buttons still hidden mid-flight', after.late.every((o) => o === 0), JSON.stringify(after.late));

    // End of the pin: the type is gone and the three blocks are in, in order –
    // eyebrow (dropped onto the copy), copy larger, buttons last
    await page.evaluate(`(async () => {
      window.scrollTo(0, Math.round(1.5 * innerHeight));
      await new Promise((r) => setTimeout(r, 1800));
    })()`);
    const landed = await page.evaluate(`(() => {
      const matrix = (el) => { const t = getComputedStyle(el).transform; return t === 'none' ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(t); };
      const lines = [...document.querySelectorAll('[data-hero-text-line]')];
      const eyebrow = document.querySelector('[data-hero-eyebrow]');
      const text = document.querySelector('[data-hero-text]');
      const actions = document.querySelector('[data-hero-actions]');
      const box = (el) => el.getBoundingClientRect();
      return {
        textScale: Math.round(matrix(text).a * 100) / 100,
        want: +getComputedStyle(document.querySelector('[data-hero]')).getPropertyValue('--hero-reveal-scale'),
        opacity: [eyebrow, text, actions].map((el) => +getComputedStyle(el).opacity),
        linesOpacity: Math.min(...lines.map((line) => +getComputedStyle(line).opacity)),
        linesY: lines.map((line) => Math.round(matrix(line).f)),
        typeOpacity: +getComputedStyle(document.querySelector('[data-hero-type]')).opacity,
        eyebrowScale: Math.round(matrix(eyebrow).a * 100) / 100,
        actionsScale: Math.round(matrix(actions).a * 100) / 100,
        gapToCopy: Math.round(box(text).top - box(eyebrow).bottom),
        order: box(eyebrow).bottom <= box(text).top && box(text).bottom <= box(actions).top,
      };
    })()`);
    check('js: all three blocks visible after the fly-through', landed.opacity.every((o) => o === 1), JSON.stringify(landed.opacity));
    check(
      'js: copy returns larger, eyebrow and buttons in normal size',
      landed.textScale === landed.want && landed.eyebrowScale === 1 && landed.actionsScale === 1,
      `copy ${landed.textScale}/${landed.want}, eyebrow ${landed.eyebrowScale}, buttons ${landed.actionsScale}`,
    );
    check('js: copy lines settled at their place', landed.linesY.every((y) => y === 0) && landed.linesOpacity > 0.99, JSON.stringify(landed.linesY));
    check('js: type has dissolved at the end of the push', landed.typeOpacity === 0, `opacity ${landed.typeOpacity}`);
    check(
      'js: eyebrow sits one gap above the copy, block reads top to bottom',
      landed.order && landed.gapToCopy > 24 && landed.gapToCopy < 56,
      `gap ${landed.gapToCopy}px, order ${landed.order}`,
    );

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

    // Current nav link follows the section under the viewport centre. One
    // absolute jump, not scrollIntoView + scrollBy: of two native scrolls in
    // the same task Lenis only keeps one, so the pair silently landed at the
    // previous step's position and the check passed on where it happened to be.
    await page.evaluate(`(async () => {
      const top = Math.round(document.getElementById('portfolio').getBoundingClientRect().top + scrollY);
      window.scrollTo(0, top + 200);
      await new Promise((r) => setTimeout(r, 800));
    })()`);
    const current = await page.evaluate(`[...document.querySelectorAll('[data-nav] a[aria-current="true"]')].map((a) => a.hash)`);
    check('js: aria-current on the portfolio link', current.length === 1 && current[0] === '#portfolio', current.join(','));

    // Logo wall settled after its stagger (6 × 0.08 s + 0.8 s)
    await sleep(1200);
    const wall = await page.evaluate(`(() => {
      const tiles = [...document.querySelectorAll('[data-portfolio-tabs] > *')];
      return { tiles: tiles.length, unsettled: tiles.filter((t) => { const cs = getComputedStyle(t); return cs.opacity !== '1' || !(cs.transform === 'none' || cs.transform === 'matrix(1, 0, 0, 1, 0, 0)'); }).length };
    })()`);
    check('js: logo-wall tiles settled after the stagger', wall.tiles === 6 && wall.unsettled === 0, JSON.stringify(wall));

    // Spotlight cross-fade: two panels overlap briefly, then exactly one is
    // left, at the same container height as before
    const before = await page.evaluate(PANELS);
    check('js: one spotlight panel before the switch', before.shown.length === 1 && before.shown[0] === 0, JSON.stringify(before));
    await page.evaluate(clickTab(2));
    await sleep(120);
    const mid = await page.evaluate(PANELS);
    check('js: spotlight cross-fade in progress (two panels, partial opacity)', mid.shown.length === 2 && mid.opacity.some((o) => o > 0 && o < 1), JSON.stringify(mid));
    check('js: spotlight height stable during the fade', Math.abs(mid.height - before.height) < 1, `${before.height} → ${mid.height}`);
    await sleep(1000);
    const done = await page.evaluate(PANELS);
    check('js: exactly one panel visible after the cross-fade', done.shown.length === 1 && done.shown[0] === 2 && done.opacity[0] === 1 && done.settled && done.selected === 2, JSON.stringify(done));
    check('js: spotlight height stable after the switch', Math.abs(done.height - before.height) < 1, `${before.height} → ${done.height}`);
    // Rapid switching: two clicks 80 ms apart still end with one settled panel
    await page.evaluate(clickTab(3));
    await sleep(80);
    await page.evaluate(clickTab(4));
    await sleep(1200);
    const rapid = await page.evaluate(PANELS);
    check('js: rapid switches settle on the last panel', rapid.shown.length === 1 && rapid.shown[0] === 4 && rapid.opacity[0] === 1 && rapid.settled && rapid.selected === 4 && Math.abs(rapid.height - before.height) < 1, JSON.stringify(rapid));

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
    // mandatory) and the progress line eases along, vertical wheel scrolls
    // the page
    const rect = await page.evaluate(`(() => { const r = document.querySelector('[data-cards]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    for (let i = 0; i < 2; i++) {
      await wheel(Math.round(rect.x), Math.round(rect.y), 0, 400);
      await sleep(400);
    }
    await sleep(600);
    const track = await page.evaluate(`(() => {
      const bar = document.querySelector('[data-progress-bar]');
      const t = getComputedStyle(bar).transform;
      const m = t === 'none' ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(t);
      return {
        left: document.querySelector('[data-cards]').scrollLeft,
        y: Math.round(scrollY),
        cardsHidden: [...document.querySelectorAll('[data-cards] > *')].filter((c) => getComputedStyle(c).opacity !== '1').length,
        scaleX: Math.round(m.a * 1000) / 1000,
        counter: document.querySelector('[data-progress-count]').textContent,
      };
    })()`);
    check('js: horizontal wheel scrolls the card track', track.left > 0, `scrollLeft ${track.left}`);
    check('js: slider cards revealed', track.cardsHidden === 0, `${track.cardsHidden} still hidden`);
    check('js: progress line eased past its start (scaleX > 1/6)', track.scaleX > 0.17 && track.scaleX <= 1, `scaleX ${track.scaleX}, counter ${track.counter}`);
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

    // Hex cursor (pointer: fine): canvas shown, lattice drawn around the
    // mouse and nowhere else, layer under the nav and click-through
    const fine = await page.evaluate(`matchMedia('(pointer: fine)').matches`);
    if (fine) {
      const at = { x: Math.round(width / 2), y: Math.round(height / 2) };
      await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: at.x, y: at.y });
      await sleep(400);
      const hex = await page.evaluate(`(() => {
        const c = document.querySelector('[data-hex-cursor]');
        if (!c) return { missing: true };
        const cs = getComputedStyle(c);
        const dpr = c.width / innerWidth;
        const ctx = c.getContext('2d');
        const lit = (x, y, size) => { const d = ctx.getImageData(Math.round(x * dpr), Math.round(y * dpr), size, size).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; };
        return { hidden: c.hidden, near: lit(${at.x} - 30, ${at.y} - 30, 60), far: lit(${at.x} + 400, ${at.y} - 20, 40), z: +cs.zIndex, navZ: +getComputedStyle(document.querySelector('[data-nav]')).zIndex, pointer: cs.pointerEvents, blend: cs.mixBlendMode };
      })()`);
      check('js: hex canvas shown for a fine pointer, lattice drawn at the mouse', !hex.missing && !hex.hidden && hex.near > 0, JSON.stringify(hex));
      check('js: hex lattice limited to the radius, under the nav, click-through, screen blend', !hex.missing && hex.far === 0 && hex.z < hex.navZ && hex.pointer === 'none' && hex.blend === 'screen', JSON.stringify(hex));
    } else {
      console.log('skip  js: hex cursor (no fine pointer)');
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
