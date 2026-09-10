/**
 * Motion layer (docs/phases/PHASE-7-animationen.md): Lenis smooth scroll,
 * GSAP + ScrollTrigger reveals, parallax, marquee loop, nav scroll state,
 * card and CTA glows (part A); hero type intro and pinned push-through,
 * slider stagger and eased progress line, logo-wall stagger, spotlight
 * cross-fade and the lazily loaded hex cursor (part B). Everything here is
 * layered on top of a page
 * that is complete without JS – start states (opacity 0, offsets) are set by
 * GSAP only, never in CSS.
 *
 * `prefers-reduced-motion: reduce` (checked live via gsap.matchMedia): only
 * the nav state (background after 40px, active link) is wired up – no smooth
 * scroll, no tweens, the marquee stays static, the spotlight switches
 * instantly (portfolio.ts default) and the hex canvas stays hidden.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

/** tokens.css --ease-out = cubic-bezier(0.22, 1, 0.36, 1) = easeOutQuint */
const EASE_OUT = 'power4.out';
const REVEAL_DURATION = 0.8;
const REVEAL_START = 'top 85%';

type Cleanup = () => void;

/* --- Nav: scroll state + active link (state, not motion – runs always) ----- */
function initNav(): void {
  const header = document.querySelector<HTMLElement>('[data-nav]');
  if (!header) return;

  // `.is-scrolled` from 40px; the 300ms transition itself is CSS (Nav.astro)
  ScrollTrigger.create({
    start: 40,
    end: 'max',
    onToggle: (self) => header.classList.toggle('is-scrolled', self.isActive),
  });

  // A link is current while its section is under the viewport centre, i.e.
  // from the section's top until the next section's top (no gap in between)
  header.querySelectorAll<HTMLAnchorElement>('nav a[href^="#"]').forEach((link) => {
    const section = document.getElementById(link.hash.slice(1));
    if (!section) return;
    // The next *section* – Astro puts the components' inline scripts between
    // them, and a <script> has no box to end the trigger on
    let next = section.nextElementSibling;
    while (next && next.tagName !== 'SECTION') next = next.nextElementSibling;
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      endTrigger: next ?? section,
      end: next ? 'top center' : 'bottom center',
      onToggle: (self) => {
        if (self.isActive) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      },
    });
  });
}

/* --- Smooth scroll (14) ---------------------------------------------------- */
function initLenis(): Cleanup {
  const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time: number): void => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  // Anchor links: Lenis honours scroll-padding-top (--scroll-offset) itself;
  // keep the hash in the URL and move focus to the target for keyboard and
  // screen-reader users, as a native jump would.
  const onClick = (event: MouseEvent): void => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link) return;
    const id = decodeURIComponent(link.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    event.preventDefault();
    history.pushState(null, '', `#${id}`);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    lenis.scrollTo(target);
  };
  document.addEventListener('click', onClick);

  return () => {
    document.removeEventListener('click', onClick);
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}

/* --- Marquee (6): endless rows, scroll-dependent speed ---------------------- */
function initMarquee(): void {
  const tweens: gsap.core.Tween[] = [];

  document.querySelectorAll<HTMLElement>('[data-marquee-direction]').forEach((row) => {
    const track = row.querySelector<HTMLElement>('[data-marquee-track]');
    if (!track) return;
    // The track holds N copies of the row (Marquee.astro) and a trailing
    // padding equal to the gap, so one copy is exactly 1/N of its width and a
    // shift by that amount loops seamlessly. Row 1 is right-aligned and moves
    // left (from +1/N to 0), row 2 left-aligned and moves right (−1/N to 0).
    const copies = Number(track.dataset.marqueeTrack) || 2;
    const period = 100 / copies;
    const left = row.dataset.marqueeDirection === 'left';
    tweens.push(
      gsap.fromTo(
        track,
        { xPercent: left ? period : -period },
        { xPercent: 0, duration: left ? 40 : 32, ease: 'none', repeat: -1 },
      ),
    );
  });
  if (!tweens.length) return;

  // Speed follows the scroll velocity (up to ×1.5) and eases back when idle
  const MAX_BOOST = 1.5;
  let target = 1;
  let current = 1;
  let lastScroll = 0;
  ScrollTrigger.create({
    onUpdate: (self) => {
      target = Math.min(MAX_BOOST, 1 + Math.abs(self.getVelocity()) / 3000);
      lastScroll = performance.now();
    },
  });
  gsap.ticker.add(() => {
    if (performance.now() - lastScroll > 150) target = 1;
    if (Math.abs(target - current) < 0.001) return;
    current += (target - current) * 0.08;
    tweens.forEach((tween) => tween.timeScale(current));
  });

  document.addEventListener('visibilitychange', () => {
    tweens.forEach((tween) => tween.paused(document.hidden));
  });
}

/* --- Hero push-through (1, 2) ---------------------------------------------
 * One scrubbed timeline over the pinned hero: the display line grows out of
 * its centre until the viewer has flown through it, the photo drifts a little
 * wider underneath and an overlay takes the frame to night. On load only the
 * headline and the scroll hint are on screen – eyebrow, copy and buttons are
 * hidden here (never in CSS) and rise in one after the other once the
 * fly-through is over; only the copy scales up.
 *
 * The scale runs on every `[data-hero-push]` layer at once, so the portal
 * mask planned for the next step only has to carry that attribute to join the
 * same tween – no rebuild here. `through` is the share of the timeline the
 * fly-through takes; the rest belongs to the reveal.
 *
 * Below 768px the hero is not pinned: scale and fade only, no reveal.
 */
const PUSH_SCALE = 8;           // type size at the end of the fly-through
const PUSH_SCALE_UNPINNED = 2.6;
const PUSH_IMAGE_SCALE = 1.12;  // the photo widens slightly with it
const PUSH_EASE = 'power2.in';
const PUSH_THROUGH = 0.72;      // share of the timeline before the reveal
const PUSH_DISTANCE = 1.5;      // pin length in viewport heights

function initHero(pinned: boolean, desktop: boolean): void {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const content = hero?.querySelector<HTMLElement>('[data-hero-content]');
  if (!hero || !content) return;

  // Intro: the letters of the display line rise from below one after the
  // other (0.03 s apart) – and nothing else, the rest of the hero belongs to
  // the reveal. Starts once the display weight has loaded so no glyphs swap
  // mid-flight (and after 1 s at the latest, should a font never arrive).
  const chars = hero.querySelectorAll<HTMLElement>('[data-hero-char]');
  const intro = gsap.timeline({ paused: true });
  intro.from(chars, { yPercent: 60, opacity: 0, stagger: 0.03, duration: REVEAL_DURATION, ease: EASE_OUT });
  const play = (): void => {
    intro.play();
  };
  document.fonts?.ready.then(play);
  gsap.delayedCall(1, play);

  const push = hero.querySelectorAll<HTMLElement>('[data-hero-push]');
  if (!push.length) return;
  const type = hero.querySelector<HTMLElement>('[data-hero-type]');
  const overlay = hero.querySelector<HTMLElement>('[data-hero-overlay]');
  const picture = hero.querySelector<HTMLElement>('[data-parallax]');
  const hint = hero.querySelector<HTMLElement>('[data-hero-hint]');
  const eyebrow = hero.querySelector<HTMLElement>('[data-hero-eyebrow]');
  const text = hero.querySelector<HTMLElement>('[data-hero-text]');
  const lines = Array.from(hero.querySelectorAll<HTMLElement>('[data-hero-text-line]'));
  const actions = hero.querySelector<HTMLElement>('[data-hero-actions]');

  // Hidden by JS only: without it, and at reduced motion, the hero is whole.
  // gsap.matchMedia reverts this when the viewport drops below 768px.
  const late = [eyebrow, text, actions].filter((el): el is HTMLElement => el !== null);
  if (pinned) gsap.set(late, { opacity: 0 });

  const through = pinned ? PUSH_THROUGH : 1;
  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      id: 'hero-push',
      trigger: hero,
      start: 'top top',
      end: pinned ? () => `+=${window.innerHeight * PUSH_DISTANCE}` : 'bottom top',
      pin: pinned,
      anticipatePin: pinned ? 1 : 0,
      scrub: 0.6,
      invalidateOnRefresh: true,
      // The pin stretches the page by PUSH_DISTANCE viewports. Everything
      // below the hero has to be measured afterwards – including the nav's
      // section triggers, which are created before this one.
      refreshPriority: 1,
    },
  });

  timeline.to(push, { scale: pinned ? PUSH_SCALE : PUSH_SCALE_UNPINNED, ease: PUSH_EASE, duration: through }, 0);
  if (picture) timeline.to(picture, { scale: PUSH_IMAGE_SCALE, ease: PUSH_EASE, duration: through }, 0);
  if (overlay) timeline.to(overlay, { opacity: 1, duration: through * 0.9 }, 0);
  // The hint has done its job as soon as the page moves
  if (hint) timeline.to(hint, { opacity: 0, duration: 0.15, ease: 'power1.in' }, 0);
  // The type dissolves just as the viewer passes through it; a mask layer
  // would keep its scale and skip this one.
  if (type) timeline.to(type, { opacity: 0, duration: through * 0.25, ease: 'power1.in' }, through * 0.75);
  timeline.addLabel('through', through);

  // Out of the dark, one block after the other: eyebrow, then the copy line
  // by line, then the buttons. Each group takes `enter`, they start `gap`
  // apart, so the buttons land exactly at the end of the timeline. Only the
  // copy grows – how much lives in CSS (--hero-reveal-scale), which also caps
  // the block's width so the scaled lines still fit the container.
  if (!pinned) return;
  const span = 1 - through;
  const enter = span * 0.4;
  const gap = (span - enter) / 2;
  const rise = desktop ? 40 : 28;

  const scale = parseFloat(getComputedStyle(hero).getPropertyValue('--hero-reveal-scale')) || 1;

  // The headline keeps its box once it has dissolved, so at its own place the
  // eyebrow would float a headline-height above the copy. It comes to rest one
  // gap above the copy instead – above its *scaled* top edge: the copy grows
  // from its bottom edge, so it rises by its full height difference.
  // Measured, and re-measured on every refresh.
  const gapPx = parseFloat(getComputedStyle(content).rowGap) || 0;
  const drop = (): number =>
    eyebrow && text
      ? text.offsetTop -
        text.offsetHeight * (scale - 1) -
        gapPx -
        (eyebrow.offsetTop + eyebrow.offsetHeight)
      : 0;

  if (eyebrow) {
    timeline.fromTo(
      eyebrow,
      { y: () => drop() + rise, opacity: 0 },
      { y: drop, opacity: 1, duration: enter, ease: EASE_OUT, immediateRender: false },
      'through',
    );
  }

  if (text && lines.length) {
    const stagger = (enter * 0.3) / Math.max(1, lines.length - 1);
    timeline
      .to(text, { duration: 0, scale, opacity: 1, immediateRender: false }, `through+=${gap}`)
      .fromTo(
        lines,
        { y: 90, opacity: 0 },
        { y: 0, opacity: 1, duration: enter * 0.7, stagger, ease: EASE_OUT, immediateRender: false },
        `through+=${gap}`,
      );
  }

  if (actions) {
    timeline.fromTo(
      actions,
      { y: rise, opacity: 0 },
      { y: 0, opacity: 1, duration: enter, ease: EASE_OUT, immediateRender: false },
      `through+=${gap * 2}`,
    );
  }
}

/* --- Reveals (4, 5, 11) ---------------------------------------------------- */
function initReveals(desktop: boolean): void {
  const distance = desktop ? 24 : 16;

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
    gsap.from(element, {
      y: distance,
      opacity: 0,
      duration: REVEAL_DURATION,
      ease: EASE_OUT,
      scrollTrigger: { trigger: element, start: REVEAL_START, once: true },
    });
  });

  // Staggered children (mission principles, focus lists). The focus lists
  // slide in from their side on desktop (data-reveal-stagger="left|right").
  document.querySelectorAll<HTMLElement>('[data-reveal-stagger]').forEach((list) => {
    const side = list.dataset.revealStagger;
    const from =
      desktop && side === 'left' ? { x: -24 } : desktop && side === 'right' ? { x: 24 } : { y: distance };
    gsap.from(Array.from(list.children), {
      ...from,
      opacity: 0,
      duration: REVEAL_DURATION,
      ease: EASE_OUT,
      stagger: 0.12,
      scrollTrigger: { trigger: list, start: REVEAL_START, once: true },
    });
  });
}

/* --- Parallax (11) – the hero photo (2) belongs to the push-through above -- */
function initParallax(desktop: boolean): void {
  const focus = document.getElementById('schwerpunkte');
  const focusBg = focus?.querySelector<HTMLElement>('[data-parallax]');
  if (focus && focusBg) {
    const shift = desktop ? 60 : 30;
    gsap.fromTo(
      focusBg,
      { y: -shift },
      {
        y: shift,
        ease: 'none',
        scrollTrigger: { trigger: focus, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  }
}

/* --- Why-K+ slider (7): staggered cards, eased progress line --------------- */
function initSlider(desktop: boolean): Cleanup | undefined {
  const track = document.querySelector<HTMLElement>('[data-cards]');
  if (!track) return;
  const cards = Array.from(track.children) as HTMLElement[];

  // Cards rise in with a stagger. Desktop: all six share one row and enter
  // together; mobile (stacked): each batch that scrolls into view staggers.
  gsap.set(cards, { y: desktop ? 24 : 16, opacity: 0 });
  ScrollTrigger.batch(cards, {
    start: REVEAL_START,
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { y: 0, opacity: 1, duration: REVEAL_DURATION, ease: EASE_OUT, stagger: 0.12 }),
  });

  // Progress line: the inline script in WarumKplus.astro derives the fill
  // from the native scroll position and announces it as `warum:progress`;
  // here the bar eases to that value instead of snapping (hidden on mobile)
  const bar = document.querySelector<HTMLElement>('[data-progress-bar]');
  if (!bar) return;
  const scaleTo = gsap.quickTo(bar, 'scaleX', { duration: 0.4, ease: 'power3' });
  const onProgress = (event: Event): void => {
    scaleTo((event as CustomEvent<{ fill: number }>).detail.fill);
  };
  track.addEventListener('warum:progress', onProgress);
  return () => track.removeEventListener('warum:progress', onProgress);
}

/* --- Portfolio logo wall (9): tiles stagger in ----------------------------- */
function initLogoWall(desktop: boolean): void {
  const wall = document.querySelector<HTMLElement>('[data-portfolio-tabs]');
  if (!wall) return;
  gsap.from(Array.from(wall.children), {
    y: desktop ? 24 : 16,
    opacity: 0,
    duration: REVEAL_DURATION,
    ease: EASE_OUT,
    stagger: 0.08,
    scrollTrigger: { trigger: wall, start: REVEAL_START, once: true },
  });
}

/* --- Portfolio spotlight (10): cross-fade on portfolio:change -------------- */
function initSpotlight(): Cleanup | undefined {
  const tablist = document.querySelector<HTMLElement>('[data-portfolio-tabs]');
  const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-portfolio-panels] > *'));
  if (!tablist || !panels.length) return;

  let current = Math.max(0, panels.findIndex((panel) => !panel.hidden));
  let timeline: gsap.core.Timeline | undefined;
  const parts = (panel: HTMLElement): Element[] => [
    panel,
    ...panel.querySelectorAll('[data-spot-media], [data-spot-text] > *'),
  ];

  /** Stops a running switch and hides every panel except `keep`, untouched. */
  const settle = (keep: HTMLElement[]): void => {
    timeline?.kill();
    timeline = undefined;
    panels.forEach((panel) => {
      if (keep.includes(panel)) return;
      panel.hidden = true;
      gsap.set(parts(panel), { clearProps: 'transform,opacity' });
    });
  };

  const onChange = (event: Event): void => {
    const { index } = (event as CustomEvent<{ index: number }>).detail;
    const next = panels[index];
    const previous = panels[current];
    if (!next || !previous || next === previous) return; // nothing to fade – portfolio.ts switches
    event.preventDefault(); // `hidden` is set here, after the fade
    settle([previous, next]);
    current = index;
    next.hidden = false;

    const media = next.querySelector('[data-spot-media]');
    const text = next.querySelector<HTMLElement>('[data-spot-text]');
    timeline = gsap.timeline({
      defaults: { duration: 0.6, ease: EASE_OUT },
      onComplete: () => {
        settle([next]);
        gsap.set(parts(next), { clearProps: 'transform,opacity' });
      },
    });
    timeline.to(
      previous,
      {
        opacity: 0,
        duration: 0.25,
        ease: 'power1.out',
        onComplete: () => {
          previous.hidden = true;
        },
      },
      0,
    );
    timeline.fromTo(next, { opacity: 0 }, { opacity: 1 }, 0.1);
    if (media) timeline.fromTo(media, { scale: 1.05 }, { scale: 1 }, 0.1);
    if (text) timeline.fromTo(Array.from(text.children), { x: 24 }, { x: 0, stagger: 0.06 }, 0.1);
  };

  tablist.addEventListener('portfolio:change', onChange);
  return () => {
    tablist.removeEventListener('portfolio:change', onChange);
    const shown = panels[current];
    settle(shown ? [shown] : []);
  };
}

/* --- CTA glow (12): slow pulse + drift with the scroll ---------------------- */
function initCtaGlow(): void {
  const glow = document.querySelector<HTMLElement>('[data-glow]');
  const section = glow?.closest<HTMLElement>('section');
  if (!glow || !section) return;
  gsap.fromTo(
    glow,
    { scale: 1, opacity: 0.8 },
    { scale: 1.12, opacity: 1, duration: 6, ease: 'sine.inOut', yoyo: true, repeat: -1 },
  );
  gsap.fromTo(
    glow,
    { y: -40 },
    {
      y: 40,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
    },
  );
}

/* --- Card glow follows the pointer (8) – hover devices only ---------------- */
function initCardGlow(): void {
  const track = document.querySelector<HTMLElement>('[data-cards]');
  if (!track) return;
  const RANGE = 60; // px of travel across the card (±30)
  Array.from(track.children).forEach((card) => {
    const glow = card.querySelector<HTMLElement>('[data-card-glow]');
    if (!glow) return;
    const xTo = gsap.quickTo(glow, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(glow, 'y', { duration: 0.6, ease: 'power3' });
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      xTo(((event as PointerEvent).clientX - rect.left) / rect.width * RANGE - RANGE / 2);
      yTo(((event as PointerEvent).clientY - rect.top) / rect.height * RANGE - RANGE / 2);
    });
    card.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

/* --- Hex cursor (15): loaded after `load`, mouse pointers only -------------- */
function loadHexCursor(): Cleanup {
  let destroy: Cleanup | undefined;
  let cancelled = false;
  const load = (): void => {
    import('./hex-cursor').then(({ initHexCursor }) => {
      if (cancelled) return;
      destroy = initHexCursor();
    });
  };
  if (document.readyState === 'complete') load();
  else window.addEventListener('load', load, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener('load', load);
    destroy?.();
  };
}

/* --- Boot ------------------------------------------------------------------- */
initNav();

const mm = gsap.matchMedia();

// Smooth scroll and the marquee do not depend on the breakpoint
mm.add('(prefers-reduced-motion: no-preference)', () => {
  const destroyLenis = initLenis();
  initMarquee();
  return destroyLenis;
});

// Scroll-driven motion per breakpoint; the pointer glow only where hover exists.
// When the conditions change, gsap.matchMedia reverts everything (all
// elements return to their visible, untransformed state).
mm.add(
  {
    reduce: '(prefers-reduced-motion: reduce)',
    desktop: '(min-width: 1024px)',
    pinned: '(min-width: 768px)', // the hero push-through pins from here up
    hover: '(hover: hover)',
  },
  (context) => {
    const { reduce = false, desktop = false, pinned = false, hover = false } = context.conditions ?? {};
    if (reduce) return;
    initHero(pinned, desktop);
    initReveals(desktop);
    initParallax(desktop);
    initCtaGlow();
    initLogoWall(desktop);
    const cleanups = [initSlider(desktop), initSpotlight()];
    if (hover) initCardGlow();
    return () => cleanups.forEach((cleanup) => cleanup?.());
  },
);

// The hex lattice needs a mouse; it loads last, after everything else
mm.add('(pointer: fine) and (prefers-reduced-motion: no-preference)', loadHexCursor);

// Web fonts change line counts – re-measure the trigger positions once loaded
document.fonts?.ready.then(() => ScrollTrigger.refresh());
