/**
 * Motion layer (docs/phases/PHASE-7-animationen.md, part A): Lenis smooth
 * scroll, GSAP + ScrollTrigger reveals, parallax, marquee loop, nav scroll
 * state, card and CTA glows. Everything here is layered on top of a page that
 * is complete without JS – start states (opacity 0, offsets) are set by GSAP
 * only, never in CSS.
 *
 * `prefers-reduced-motion: reduce` (checked live via gsap.matchMedia): only
 * the nav state (background after 40px, active link) is wired up – no smooth
 * scroll, no tweens, the marquee stays static.
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
    const next = section.nextElementSibling;
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
function initLenis(): () => void {
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

/* --- Parallax (2, 11) ------------------------------------------------------ */
function initParallax(desktop: boolean): void {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const heroImage = hero?.querySelector<HTMLElement>('[data-parallax]');
  if (hero && heroImage) {
    gsap.fromTo(
      heroImage,
      { scale: desktop ? 1.1 : 1, y: 0 },
      {
        scale: 1,
        y: desktop ? 120 : 60,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      },
    );
  }

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
    hover: '(hover: hover)',
  },
  (context) => {
    const { reduce = false, desktop = false, hover = false } = context.conditions ?? {};
    if (reduce) return;
    initReveals(desktop);
    initParallax(desktop);
    initCtaGlow();
    if (hover) initCardGlow();
  },
);

// Web fonts change line counts – re-measure the trigger positions once loaded
document.fonts?.ready.then(() => ScrollTrigger.refresh());
