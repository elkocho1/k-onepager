/**
 * Why-K+ slider (WarumKplus.astro): progress line + counter, and – on desktop
 * without reduced motion – the scroll pin that turns the vertical scroll into
 * the horizontal movement of the cards.
 *
 * Native mode (below 1024px, reduced motion, and the layout without this
 * script): the card track is a horizontal scroll container with scroll snap;
 * the progress line and the counter follow its scroll position.
 *
 * Pinned mode (`PIN_QUERY`): the section becomes the scroll runway and its
 * inner block sticks once the section's bottom edge reaches the bottom of the
 * viewport (`position: sticky; top: viewport height − block height`). The
 * runway is `overflow × PIN_TRAVEL` px longer than the block, where
 * `overflow` is the width of the card row beyond the content container – the
 * scroll distance inside the runway is mapped onto `translateX` of the track,
 * so at the end the last card sits flush with the container's right edge and
 * the pin releases. No wheel handling, no scroll blocking: the page scrolls
 * natively (Lenis on top), the transform is derived from the scroll position
 * on every scroll event. Counter and line share the same progress.
 *
 * Section height, sticky offset, scroll margin (so anchor jumps land at the
 * pin start) and the overflow are re-measured on resize and whenever the
 * block or the track changes size (fonts, images). A `warum:pin` event
 * (bubbling, detail { height, travel }) tells the motion layer that the page
 * height changed. `warum:progress` (detail { fill, active }) lets it ease the
 * line (animations.ts, item 7).
 */

/**
 * Scroll distance per pixel of horizontal overflow. 1 = the cards move 1:1
 * with the scroll; 1.5 gives every card half as much scroll travel again.
 * The runway length is `overflow × PIN_TRAVEL` (plus the block height).
 */
const PIN_TRAVEL = 1;
const PIN_QUERY = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)';
const PINNED_CLASS = 'warum--pinned';

const section = document.querySelector<HTMLElement>('[data-warum]');
const sticky = section?.querySelector<HTMLElement>('[data-warum-sticky]');
const slider = section?.querySelector<HTMLElement>('[data-warum-slider]');
const track = section?.querySelector<HTMLElement>('[data-cards]');
const bar = section?.querySelector<HTMLElement>('[data-progress-bar]');
const count = section?.querySelector<HTMLElement>('[data-progress-count]');

if (section && sticky && slider && track && bar && count) {
  const cards = Array.from(track.children) as HTMLElement[];
  const total = cards.length;
  const pad = (n: number): string => String(n).padStart(2, '0');
  const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

  /* --- Progress line + counter (both modes) ------------------------------ */
  const render = (ratio: number, active: number): void => {
    const fill = (1 + ratio * (total - 1)) / total;
    bar.style.setProperty('--progress', String(fill));
    count.textContent = `${pad(active + 1)}/${pad(total)}`;
    track.dispatchEvent(new CustomEvent('warum:progress', { bubbles: true, detail: { fill, active } }));
  };

  /** Native mode: the card whose start sits closest to the snap edge. */
  const nearestCard = (): number => {
    const edge = slider.getBoundingClientRect().left + (parseFloat(getComputedStyle(track).paddingInlineStart) || 0);
    let active = 0;
    let best = Infinity;
    cards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - edge);
      if (distance < best) {
        best = distance;
        active = index;
      }
    });
    return active;
  };

  const updateNative = (): void => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    const ratio = maxScroll > 0 ? Math.min(1, track.scrollLeft / maxScroll) : 0;
    render(ratio, nearestCard());
  };

  /* --- Pinned mode --------------------------------------------------------- */
  let pinned = false;
  let overflow = 0; // px the card row extends beyond the container's right edge
  let travel = 0; // scroll distance of the pin = overflow × PIN_TRAVEL
  let pinTop = 0; // sticky offset: viewport height − block height
  let appliedHeight = -1;

  /** Progress 0..1 inside the runway, from the section's live position. */
  const pinProgress = (): number => {
    if (travel <= 0) return 0;
    return clamp((pinTop - section.getBoundingClientRect().top) / travel, 0, 1);
  };

  const updatePinned = (): void => {
    const progress = pinProgress();
    // Whole pixels keep the card type crisp while the row rests mid-way
    track.style.transform = `translate3d(${-Math.round(overflow * progress)}px, 0, 0)`;
    render(progress, Math.round(progress * (total - 1)));
  };

  /**
   * Measures the block and the card row and sets the runway: section height
   * = block height + travel, sticky top = viewport height − block height
   * (bottom edge on the bottom of the viewport; negative when the block is
   * taller than the viewport, so the cards and the line stay in view),
   * scroll-margin so an anchor jump lands exactly at the pin start.
   */
  const measure = (): void => {
    const last = cards[total - 1];
    if (!last) return;
    // Rect differences inside the track are unaffected by its transform
    const rowEnd = last.getBoundingClientRect().right - track.getBoundingClientRect().left;
    const paddingEnd = parseFloat(getComputedStyle(track).paddingInlineEnd) || 0;
    overflow = Math.max(0, Math.round(rowEnd + paddingEnd - slider.clientWidth));
    travel = Math.round(overflow * PIN_TRAVEL);

    const height = sticky.offsetHeight;
    pinTop = window.innerHeight - height;
    const scrollPadding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    section.style.setProperty('--warum-pin-height', `${height + travel}px`);
    section.style.setProperty('--warum-pin-top', `${pinTop}px`);
    section.style.setProperty('--warum-pin-travel', `${travel}px`);
    section.style.setProperty('--warum-pin-margin', `${Math.max(0, pinTop - scrollPadding)}px`);
    updatePinned();

    const runway = height + travel;
    if (runway !== appliedHeight) {
      appliedHeight = runway;
      section.dispatchEvent(new CustomEvent('warum:pin', { bubbles: true, detail: { height, travel } }));
    }
  };

  const onScroll = (): void => {
    updatePinned();
  };

  // Fonts and images change the block height, the breakpoint the card width
  const observer = new ResizeObserver(() => {
    if (pinned) measure();
  });

  const enablePin = (): void => {
    pinned = true;
    track.scrollLeft = 0; // hand the native position over to the transform
    track.removeAttribute('tabindex'); // nothing to scroll by keyboard any more
    section.classList.add(PINNED_CLASS);
    window.addEventListener('scroll', onScroll, { passive: true });
    observer.observe(sticky);
    observer.observe(slider);
    measure();
  };

  const disablePin = (): void => {
    pinned = false;
    window.removeEventListener('scroll', onScroll);
    observer.disconnect();
    section.classList.remove(PINNED_CLASS);
    ['--warum-pin-height', '--warum-pin-top', '--warum-pin-travel', '--warum-pin-margin'].forEach((name) =>
      section.style.removeProperty(name),
    );
    track.style.transform = '';
    track.tabIndex = 0;
    updateNative();
    if (appliedHeight !== -1) {
      appliedHeight = -1;
      section.dispatchEvent(new CustomEvent('warum:pin', { bubbles: true, detail: { height: sticky.offsetHeight, travel: 0 } }));
    }
  };

  /* --- Wiring ---------------------------------------------------------------- */
  track.addEventListener('scroll', updateNative, { passive: true });
  window.addEventListener('resize', () => {
    if (pinned) measure();
    else updateNative();
  });

  const query = window.matchMedia(PIN_QUERY);
  const applyMode = (): void => {
    if (query.matches && !pinned) enablePin();
    else if (!query.matches && pinned) disablePin();
  };
  query.addEventListener('change', applyMode);
  applyMode();
  if (!pinned) updateNative();
}
