/**
 * Hex cursor (docs/phases/PHASE-7-animationen.md, item 15): a magenta
 * hexagon lattice that only shows inside a soft radius around the pointer,
 * drawn on the fixed, click-through <canvas> from HexCursor.astro. Loaded
 * lazily after `load` by animations.ts – only for `(pointer: fine)` and not
 * with `prefers-reduced-motion: reduce`. The pointer position is eased
 * (lerp 0.15); the frame loop only runs while the mouse moved within the
 * last 2 s, and stops when the pointer leaves the window or the tab is
 * hidden. Recomputes the canvas on resize.
 */

const EDGE = 28; // hexagon edge length (px)
const RADIUS = 220; // visible radius around the pointer (px)
const LERP = 0.15;
const IDLE_MS = 2000;
const COLOR = '#ff00ff'; // --c-magenta (tokens.css) – a canvas cannot read CSS variables

export function initHexCursor(): () => void {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-hex-cursor]');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return () => {};

  // Pointy-top hexagons: cell width √3·edge, row step 1.5·edge, every other
  // row shifted by half a cell. Vertices relative to the cell centre.
  const cellWidth = Math.sqrt(3) * EDGE;
  const rowStep = 1.5 * EDGE;
  const corners = Array.from({ length: 6 }, (_, k) => {
    const angle = Math.PI / 6 + (k * Math.PI) / 3;
    return [EDGE * Math.cos(angle), EDGE * Math.sin(angle)] as const;
  });
  // Cells whose centre lies within this distance can touch the visible disc
  const reach = RADIUS + EDGE;

  let width = 0;
  let height = 0;
  let visible = false; // the canvas currently shows a lattice
  let lastMove = -Infinity;
  let frame = 0;
  const target = { x: 0, y: 0 };
  const position = { x: 0, y: 0 };

  const clear = (): void => {
    ctx.clearRect(0, 0, width, height);
    visible = false;
  };

  const resize = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    // Setting the size resets the context state
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLOR;
    visible = false;
  };

  const draw = (x: number, y: number): void => {
    ctx.clearRect(0, 0, width, height);

    // Lattice around the pointer – one path, one stroke
    ctx.beginPath();
    const rowStart = Math.floor((y - reach) / rowStep);
    const rowEnd = Math.ceil((y + reach) / rowStep);
    for (let row = rowStart; row <= rowEnd; row++) {
      const cy = row * rowStep;
      const offset = Math.abs(row % 2) === 1 ? cellWidth / 2 : 0;
      const colStart = Math.floor((x - reach - offset) / cellWidth);
      const colEnd = Math.ceil((x + reach - offset) / cellWidth);
      for (let col = colStart; col <= colEnd; col++) {
        const cx = col * cellWidth + offset;
        if ((cx - x) ** 2 + (cy - y) ** 2 > reach * reach) continue;
        ctx.moveTo(cx + corners[0][0], cy + corners[0][1]);
        for (let k = 1; k < 6; k++) ctx.lineTo(cx + corners[k][0], cy + corners[k][1]);
        ctx.closePath();
      }
    }
    ctx.stroke();

    // Keep the lattice only inside the soft disc: a radial alpha gradient
    // composited with destination-in over the whole drawn extent
    const extent = reach + EDGE;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, RADIUS);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.55, 'rgba(0, 0, 0, 0.55)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = gradient;
    ctx.fillRect(x - extent, y - extent, extent * 2, extent * 2);
    ctx.globalCompositeOperation = 'source-over';
    visible = true;
  };

  const tick = (): void => {
    frame = 0;
    position.x += (target.x - position.x) * LERP;
    position.y += (target.y - position.y) * LERP;
    draw(position.x, position.y);
    if (performance.now() - lastMove < IDLE_MS && !document.hidden) frame = requestAnimationFrame(tick);
  };

  const onMove = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return;
    target.x = event.clientX;
    target.y = event.clientY;
    // After (re-)entering the window start at the pointer instead of sweeping in
    if (!visible) {
      position.x = target.x;
      position.y = target.y;
    }
    lastMove = performance.now();
    if (!frame) frame = requestAnimationFrame(tick);
  };

  const stop = (): void => {
    cancelAnimationFrame(frame);
    frame = 0;
  };

  const onLeave = (): void => {
    stop();
    clear();
  };

  const onVisibility = (): void => {
    if (document.hidden) stop();
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
    clear();
    canvas.hidden = true;
  };
}
