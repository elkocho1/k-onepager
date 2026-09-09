/**
 * Portfolio logo wall: WAI-ARIA tabs. Clicking a tile (or using arrow keys,
 * Home, End on a focused tile) selects it and shows its spotlight panel.
 * Without JS the first panel is visible and the tiles are inert.
 * Dispatches `portfolio:change` (bubbling, cancelable, detail { slug, index })
 * before switching the panels: the motion layer (animations.ts) cancels it to
 * cross-fade and sets `hidden` itself after the fade; otherwise (no motion,
 * reduced motion) the panels switch right here.
 */
export function initPortfolio(root: ParentNode = document): void {
  const tablist = root.querySelector<HTMLElement>('[data-portfolio-tabs]');
  if (!tablist) return;

  const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls') ?? ''));

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
    tab.addEventListener('click', () => select(index));
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
