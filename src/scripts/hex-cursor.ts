/**
 * Hex cursor (docs/phases/PHASE-7-animationen.md, item 15): a magenta
 * hexagon lattice on the fixed, click-through <canvas> from HexCursor.astro,
 * drawn as a spotlight with a cell trail.
 *
 *  - Spotlight: a soft light cone of SPOTLIGHT_RADIUS around an eased pointer
 *    position (lerp FOLLOW_EASE per frame) – the lattice shows inside it,
 *    fading to the rim, plus a faint magenta halo.
 *  - Intensity: rises to 1 while the mouse moves (RISE_MS) and falls back to
 *    0 within IDLE_FADE_MS once it rests or leaves the window – nothing stays
 *    on screen for a resting pointer.
 *  - Trail: every cell the spotlight passes is lit (stronger towards the
 *    centre) and fades on its own with an exponential decay, 1 % left after
 *    CELL_DECAY ms – a comet tail along the mouse path.
 *  - Outside spotlight and trail the canvas is clear.
 *  - Blocks: elements marked `data-hex-block` (photos, cards, tiles, the
 *    spotlight panel, the focus-areas section) are cut out of the layer
 *    every frame, so the lattice only shows on the plain night surface. The
 *    canvas is fixed and viewport-sized, so their client rects are canvas
 *    coordinates; they are erased with `destination-out`, following the
 *    element's corner radius.
 *
 * Loaded lazily after `load` by animations.ts – only for `(pointer: fine)`
 * with `(hover: hover)` and not with `prefers-reduced-motion: reduce`, so
 * touch devices and reduced motion never get the canvas shown. Only cells
 * around the pointer and the lit cells are touched per frame; the frame loop
 * stops as soon as the intensity is 0 and no cell is lit. Recomputes the
 * canvas on resize (device pixel ratio up to 2). The lattice lives in
 * viewport space (the canvas is fixed), like the previous version.
 */

/* --- Tuning ----------------------------------------------------------------
 * One mutable object so the values can be changed live in the dev server:
 * `hexCursor.SPOTLIGHT_RADIUS = 200` in the console (exposed in dev only).
 */
export const TUNING = {
  /** Spotlight radius around the eased pointer (px). */
  SPOTLIGHT_RADIUS: 150,
  /** Lerp factor per frame (at 60 fps) with which the light follows the mouse – lower = more lag. */
  FOLLOW_EASE: 0.12,
  /** Time from full intensity to 0 once the mouse rests or leaves (ms). */
  IDLE_FADE_MS: 400,
  /** Time from 0 to full intensity while the mouse moves (ms). */
  RISE_MS: 120,
  /** A lit cell has faded to 1 % after this time (ms) – exponential decay. */
  CELL_DECAY: 750,
  /** Hexagon fill alpha at full cell energy. */
  CELL_FILL_ALPHA: 0.12,
  /** Hexagon outline alpha at full cell energy. */
  CELL_STROKE_ALPHA: 0.9,
  /** Lattice line alpha at the spotlight centre (fades to 0 at the rim). */
  SPOTLIGHT_LINE_ALPHA: 0.35,
  /** Soft magenta halo alpha at the spotlight centre. */
  SPOTLIGHT_GLOW_ALPHA: 0.07,
  /** Cell activation falloff towards the rim: (1 - d/R) ^ ACTIVATION_POWER. */
  ACTIVATION_POWER: 2,
};

/* Lattice geometry and colour – the same hexagons as before (design spec: edge
   28 px, 1 px magenta lines). A canvas cannot read CSS custom properties, so
   --c-magenta (tokens.css) is repeated here. */
const EDGE = 28; // hexagon edge length (px)
const LINE_WIDTH = 1;
const COLOR = '#ff00ff'; // --c-magenta

const MOVE_HOLD_MS = 80; // a mousemove counts as "moving" for this long
const DECAY_TO_1_PERCENT = Math.log(100); // exp(-k · t / CELL_DECAY) = 0.01 at t = CELL_DECAY
const DPR_MAX = 2;

type Cell = { cx: number; cy: number; energy: number };
type Block = { el: HTMLElement; radius: number };

export function initHexCursor(): () => void {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-hex-cursor]');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return () => {};

  if (import.meta.env.DEV) (window as unknown as { hexCursor: typeof TUNING }).hexCursor = TUNING;

  // Pointy-top hexagons: cell width √3·edge, row step 1.5·edge, every other
  // row shifted by half a cell. Vertices relative to the cell centre.
  const cellWidth = Math.sqrt(3) * EDGE;
  const rowStep = 1.5 * EDGE;
  const corners = Array.from({ length: 6 }, (_, k) => {
    const angle = Math.PI / 6 + (k * Math.PI) / 3;
    return [EDGE * Math.cos(angle), EDGE * Math.sin(angle)] as const;
  });

  let width = 0;
  let height = 0;
  let frame = 0;
  let lastFrame = 0;
  let lastMove = -Infinity;
  let gone = true; // pointer outside the window (or never seen)
  let intensity = 0; // 0..1, speed-dependent overall brightness
  const target = { x: 0, y: 0 }; // real pointer
  const position = { x: 0, y: 0 }; // eased spotlight centre
  // Lit cells by lattice index (row/col packed into one number)
  const cells = new Map<number, Cell>();
  // Elements the lattice must not cover, with their corner radius (px,
  // re-read on resize – it may be fluid)
  const blocks: Block[] = Array.from(document.querySelectorAll<HTMLElement>('[data-hex-block]'), (el) => ({
    el,
    radius: 0,
  }));

  const measureRadii = (): void => {
    for (const block of blocks) block.radius = parseFloat(getComputedStyle(block.el).borderTopLeftRadius) || 0;
  };

  const hexPath = (cx: number, cy: number): void => {
    ctx.moveTo(cx + corners[0][0], cy + corners[0][1]);
    for (let k = 1; k < 6; k++) ctx.lineTo(cx + corners[k][0], cy + corners[k][1]);
    ctx.closePath();
  };

  // Visit the cells whose centre lies within `radius` of (x, y)
  const forCellsAround = (
    x: number,
    y: number,
    radius: number,
    visit: (key: number, cx: number, cy: number, distance: number) => void,
  ): void => {
    const rowStart = Math.floor((y - radius) / rowStep);
    const rowEnd = Math.ceil((y + radius) / rowStep);
    for (let row = rowStart; row <= rowEnd; row++) {
      const cy = row * rowStep;
      const offset = Math.abs(row % 2) === 1 ? cellWidth / 2 : 0;
      const colStart = Math.floor((x - radius - offset) / cellWidth);
      const colEnd = Math.ceil((x + radius - offset) / cellWidth);
      for (let col = colStart; col <= colEnd; col++) {
        const cx = col * cellWidth + offset;
        const distance = Math.hypot(cx - x, cy - y);
        if (distance > radius) continue;
        visit((row + 0x8000) * 0x10000 + (col + 0x8000), cx, cy, distance);
      }
    }
  };

  const clear = (): void => {
    ctx.clearRect(0, 0, width, height);
  };

  // Cut every block in the viewport out of what was drawn. Measured per
  // frame: blocks scroll, and the pinned card row translates.
  const eraseBlocks = (): void => {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;
    for (const { el, radius } of blocks) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || r.bottom <= 0 || r.top >= height || r.right <= 0 || r.left >= width) continue;
      ctx.beginPath();
      if (radius > 0 && typeof ctx.roundRect === 'function') ctx.roundRect(r.left, r.top, r.width, r.height, radius);
      else ctx.rect(r.left, r.top, r.width, r.height);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  };

  const resize = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    // Setting the size resets the context state
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = COLOR;
    ctx.fillStyle = COLOR;
    measureRadii();
  };

  const draw = (): void => {
    const radius = TUNING.SPOTLIGHT_RADIUS;
    const { x, y } = position;
    clear();

    if (intensity > 0) {
      // Spotlight: lattice around the light in one path, one stroke, then
      // kept only inside the soft disc (radial alpha, destination-in)
      const reach = radius + EDGE;
      ctx.globalAlpha = intensity * TUNING.SPOTLIGHT_LINE_ALPHA;
      ctx.beginPath();
      forCellsAround(x, y, reach, (_key, cx, cy) => hexPath(cx, cy));
      ctx.stroke();

      const extent = reach + EDGE;
      const mask = ctx.createRadialGradient(x, y, 0, x, y, radius);
      mask.addColorStop(0, 'rgba(0, 0, 0, 1)');
      mask.addColorStop(0.5, 'rgba(0, 0, 0, 0.6)');
      mask.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = mask;
      ctx.fillRect(x - extent, y - extent, extent * 2, extent * 2);
      ctx.globalCompositeOperation = 'source-over';

      // Halo: a faint magenta cone under the lines
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, `rgba(255, 0, 255, ${TUNING.SPOTLIGHT_GLOW_ALPHA * intensity})`);
      glow.addColorStop(1, 'rgba(255, 0, 255, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      ctx.fillStyle = COLOR;
    }

    // Trail: every lit cell with its own energy – fill lightly, outline stronger
    for (const cell of cells.values()) {
      ctx.beginPath();
      hexPath(cell.cx, cell.cy);
      ctx.globalAlpha = cell.energy * TUNING.CELL_FILL_ALPHA;
      ctx.fill();
      ctx.globalAlpha = cell.energy * TUNING.CELL_STROKE_ALPHA;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Nothing of the above over photos and blocks
    if (blocks.length > 0 && (intensity > 0 || cells.size > 0)) eraseBlocks();
  };

  const tick = (): void => {
    frame = 0;
    // One clock for everything (the rAF timestamp can precede the
    // performance.now() the loop was started with); clamped after a paused tab
    const now = performance.now();
    const dt = Math.min(Math.max(now - lastFrame, 0), 64);
    lastFrame = now;

    // Intensity follows the movement: up quickly while moving, down within
    // IDLE_FADE_MS when the mouse rests or has left the window
    const moving = !gone && now - lastMove < MOVE_HOLD_MS;
    intensity = moving
      ? Math.min(1, intensity + dt / TUNING.RISE_MS)
      : Math.max(0, intensity - dt / TUNING.IDLE_FADE_MS);

    // The light follows the pointer with a lag (frame-rate independent lerp)
    const ease = 1 - (1 - TUNING.FOLLOW_EASE) ** (dt / (1000 / 60));
    position.x += (target.x - position.x) * ease;
    position.y += (target.y - position.y) * ease;

    // Light the cells under the spotlight, stronger towards its centre
    if (intensity > 0) {
      const radius = TUNING.SPOTLIGHT_RADIUS;
      forCellsAround(position.x, position.y, radius, (key, cx, cy, distance) => {
        const energy = intensity * (1 - distance / radius) ** TUNING.ACTIVATION_POWER;
        const cell = cells.get(key);
        if (cell) cell.energy = Math.max(cell.energy, energy);
        else cells.set(key, { cx, cy, energy });
      });
    }

    // Every lit cell fades on its own
    const decay = Math.exp((-DECAY_TO_1_PERCENT * dt) / TUNING.CELL_DECAY);
    for (const [key, cell] of cells) {
      cell.energy *= decay;
      if (cell.energy < 0.01) cells.delete(key);
    }

    draw();

    // Keep going while the mouse moves (the first frame may not have raised
    // the intensity yet), while the light shows, and while a cell is lit
    if ((moving || intensity > 0 || cells.size > 0) && !document.hidden) frame = requestAnimationFrame(tick);
    else clear();
  };

  const start = (): void => {
    if (frame) return;
    lastFrame = performance.now();
    frame = requestAnimationFrame(tick);
  };

  const onMove = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return;
    target.x = event.clientX;
    target.y = event.clientY;
    // After (re-)entering the window the light starts at the pointer instead
    // of sweeping in from where it was last seen
    if (gone || intensity === 0) {
      position.x = target.x;
      position.y = target.y;
    }
    gone = false;
    lastMove = performance.now();
    start();
  };

  const stop = (): void => {
    cancelAnimationFrame(frame);
    frame = 0;
  };

  const onLeave = (): void => {
    gone = true; // the loop fades the light and the trail out
  };

  const onVisibility = (): void => {
    if (document.hidden) {
      stop();
      intensity = 0;
      cells.clear();
      clear();
    }
  };

  resize();
  canvas.hidden = false;
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('mouseleave', onLeave);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    stop();
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('mouseleave', onLeave);
    document.removeEventListener('visibilitychange', onVisibility);
    cells.clear();
    clear();
    canvas.hidden = true;
  };
}
