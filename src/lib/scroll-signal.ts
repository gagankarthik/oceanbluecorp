/* ============================================================
   A one-value store for the current scroll velocity.

   Deliberately a module-level object rather than React context
   or state. Lenis emits a scroll event on every animation frame;
   routing that through `useState` would re-render every consumer
   sixty times a second to move a background, which is the most
   expensive possible way to draw a wave.

   Instead: SmoothScroll writes here, and consumers READ it from
   inside their own requestAnimationFrame loop. No subscriptions,
   no re-renders, no scheduling — the value is simply current
   whenever anyone looks at it.

   This is safe as a module global specifically because it is
   ephemeral, browser-only display state with a single writer. It
   is not a pattern to reach for with anything that belongs in
   React's tree, and nothing here may be read during render — an
   SSR pass would see the initial values and disagree with the
   client on hydration.
   ============================================================ */

type ScrollSignal = {
  /** Pixels per frame, signed. Positive scrolling down. */
  velocity: number;
  /** |velocity| normalised to roughly 0–1 against a brisk flick, then clamped.
   *  Consumers want "how hard is this being scrolled", not raw pixels. */
  intensity: number;
  /** Absolute scroll position, px. */
  y: number;
};

/** Velocity at which `intensity` reaches 1. ~55px/frame is a firm flick on a
 *  trackpad; past that the wave should not keep growing or a fast scroll rips
 *  the amplitude off the top of the band. */
const FULL_TILT = 55;

const signal: ScrollSignal = { velocity: 0, intensity: 0, y: 0 };

/** Read-only view. Call inside a rAF loop, never during render. */
export function readScroll(): Readonly<ScrollSignal> {
  return signal;
}

/** Written only by SmoothScroll. */
export function writeScroll(velocity: number, y: number): void {
  signal.velocity = velocity;
  signal.y = y;
  signal.intensity = Math.min(Math.abs(velocity) / FULL_TILT, 1);
}

/** Reset on unmount, so a stale velocity cannot leak into the next page and
 *  start it mid-motion. */
export function clearScroll(): void {
  signal.velocity = 0;
  signal.intensity = 0;
  signal.y = 0;
}
