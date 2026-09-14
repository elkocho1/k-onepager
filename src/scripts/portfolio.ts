/**
 * Portfolio logo wall: WAI-ARIA tabs. Clicking a tile (or using arrow keys,
 * Home, End on a focused tile) selects it and shows its spotlight panel.
 * Without JS the first panel is visible and the tiles are inert.
 * Dispatches `portfolio:change` (bubbling, cancelable, detail { slug, index })
 * before switching the panels: the motion layer (animations.ts) cancels it to
 * cross-fade and sets `hidden` itself after the fade; otherwise (no motion,
 * reduced motion) the panels switch right here.
 * A click on a tile also brings the spotlight block into view (unless it is
 * fully visible already): `portfolio:scroll` (bubbling, cancelable, detail
 * { target, top }) lets the motion layer scroll with Lenis; otherwise the
 * page scrolls natively (scroll-behavior from the CSS). `top` is the layout
 * position minus --scroll-offset, measured through the offsetParent chain so
 * a reveal transform still in flight does not shift the target. Keyboard
 * selection does not scroll, so the focused tile stays on screen.
 */
export function initPortfolio(root: ParentNode = document): void {
  const tablist = root.querySelector<HTMLElement>('[data-portfolio-tabs]');
  if (!tablist) return;

  const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls') ?? ''));
  const spotlights = root.querySelector<HTMLElement>('[data-portfolio-panels]');

  // Layout top of an element ignoring transforms (offsetTop is layout-based)
  const layoutTop = (element: HTMLElement): number => {
    let top = 0;
    for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) top += node.offsetTop;
    return top;
  };

  const reveal = (): void => {
    if (!spotlights) return;
    const offset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scroll-offset')) || 0;
    const rect = spotlights.getBoundingClientRect();
    if (rect.top >= offset && rect.bottom <= window.innerHeight) return;
    const top = layoutTop(spotlights) - offset;
    const proceed = tablist.dispatchEvent(
      new CustomEvent('portfolio:scroll', { bubbles: true, cancelable: true, detail: { target: spotlights, top } }),
    );
    if (proceed) window.scrollTo({ top });
  };

  const select = (index: number, focus = false): void => {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    if (focus) tabs[index]?.focus({ preventScroll: true });
    const proceed = tablist.dispatchEvent(
      new CustomEvent('portfolio:change', {
        bubbles: true,
        cancelable: true,
        detail: { slug: tabs[index]?.dataset.slug, index },
      }),
    );
    if (proceed) {
      panels.forEach((panel, i) => {
        if (panel) panel.hidden = i !== index;
      });
    }
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      select(index);
      reveal();
    });
    tab.addEventListener('keydown', (event) => {
      const targets: Record<string, number> = {
        ArrowRight: index + 1,
        ArrowLeft: index - 1,
        Home: 0,
        End: tabs.length - 1,
      };
      const target = targets[event.key];
      if (target === undefined) return;
      event.preventDefault();
      select((target + tabs.length) % tabs.length, true);
    });
  });
}

initPortfolio();
