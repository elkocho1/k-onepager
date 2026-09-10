/**
 * Hero background video (docs/phases/PHASE-7-animationen.md, Hero.astro).
 *
 * The `<video>` in the markup has no `src`: the file is requested here, and
 * only when it is going to be seen and wanted –
 *
 *   – not at `prefers-reduced-motion: reduce` (nothing is loaded at all, the
 *     photo stays),
 *   – not below 768px (data volume – same, photo only),
 *   – not before the hero is in the viewport, and playback only once
 *     `canplay` has fired, so the fade never reveals an empty frame.
 *
 * Without JS none of this happens: no request, and the video stays fully
 * transparent above the photo (CSS, Hero.astro) instead of sitting on it as a
 * black plate. `.is-playing` fades it in once it really runs.
 *
 * The push-through scale runs on `[data-parallax]` (animations.ts) – photo and
 * video widen together, whether the video plays or not.
 */
const MIN_WIDTH = 768;

const video = document.querySelector<HTMLVideoElement>('[data-hero-video]');
const hero = video?.closest<HTMLElement>('[data-hero]');
const source = video?.dataset.src;

if (video && hero && source) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wide = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`);
  let inView = false;
  let loaded = false;

  const wanted = (): boolean => wide.matches && !reduce.matches;

  /** First request for the file – nothing before this line touches the network. */
  const load = (): void => {
    if (loaded || !inView || !wanted()) return;
    loaded = true;
    video.src = source;
  };

  /** In the viewport, decodable, wanted: run it and fade over the photo. */
  const start = (): void => {
    if (!inView || !wanted() || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    video.play().then(
      () => video.classList.add('is-playing'),
      () => {
        /* autoplay refused – the photo underneath carries the hero */
      },
    );
  };

  const stop = (): void => {
    video.classList.remove('is-playing');
    video.pause();
  };

  video.addEventListener('canplay', start);

  new IntersectionObserver(
    (entries) => {
      inView = entries[entries.length - 1]?.isIntersecting ?? false;
      if (!inView) {
        video.pause();
        return;
      }
      load();
      start();
    },
    { threshold: 0 },
  ).observe(hero);

  // A viewport that grows past 768px may still get the video; reduced motion
  // switched on mid-session takes it off the screen again.
  const update = (): void => {
    if (!wanted()) {
      stop();
      return;
    }
    load();
    start();
  };
  reduce.addEventListener('change', update);
  wide.addEventListener('change', update);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else start();
  });
}
