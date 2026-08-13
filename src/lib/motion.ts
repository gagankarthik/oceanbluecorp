/* ============================================================
   The motion language.

   One file so that everything on the marketing site accelerates
   and settles the same way. A site reads as designed when its
   movement is consistent and as assembled when every component
   picked its own curve, which is exactly what had started to
   happen here, with easings copied between files and drifting.

   Pure constants: no React, no DOM. Safe to import anywhere.

   ── The two motifs ──────────────────────────────────────────
   Everything visual on this site is built from one of two ideas,
   both taken from the brand rather than from a component
   gallery:

     ARC  , time and progress. From the anniversary artwork: a
             number inside a ring of years. Arcs DRAW.
     WAVE , the name and the logo mark. Waves TRAVEL, and their
             amplitude answers to scroll.

   If a new element cannot be expressed as one of those two, it
   probably should not be moving.
   ============================================================ */

/** The house curve. A strong deceleration, fast departure, long settle. Used
 *  for anything entering, and for scroll-linked springs. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Symmetric, for things that move and stop under their own steam (loaders,
 *  looping cycles) rather than arriving somewhere. */
export const EASE_CYCLE = [0.65, 0, 0.35, 1] as const;

/** Exponential-out, as a callable. For Lenis, which takes a function. */
export const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Durations, in seconds. Named for intent, not for length, so a change of
 *  taste is one edit here rather than forty across the codebase. */
export const DUR = {
  /** State flips: colour, opacity, a hover. Below ~150ms reads as instant. */
  tap: 0.25,
  /** The default. Content entering on scroll. */
  enter: 0.7,
  /** Deliberate, watched movement: a mark assembling, an arc drawing. */
  reveal: 1.1,
  /** Full-length set pieces. Use sparingly; this is long enough to be noticed. */
  set: 1.9,
  /** Ambient, endlessly repeating motion, loaders, pulses, drifting fields.
   *  Much slower than anything with a destination. A repeating animation is
   *  running the entire time someone is on the page, so its job is to stay
   *  under the threshold of attention; anything quick enough to *notice* on the
   *  first cycle is maddening by the twentieth. */
  loop: 3.4,
} as const;

/** Distance travelled on entrance, px. Small on purpose: a long rise reads as
 *  a page that has not finished loading. Phones get less, the same 28px is a
 *  much larger fraction of a small viewport and lands as a lurch. */
export const RISE = { default: 26, narrow: 14 } as const;

/** Gap between staggered siblings, seconds. Past ~8 items a fixed stagger makes
 *  the last one arrive late enough to feel broken, clamp with `staggerFor`. */
export const STAGGER = 0.075;

/** Total stagger held to `max` seconds however many children there are. */
export function staggerFor(count: number, max = 0.5): number {
  if (count <= 1) return 0;
  return Math.min(STAGGER, max / (count - 1));
}

/* ── Wave geometry ──────────────────────────────────────────
   Wave paths are built once at module load and animated with
   transforms only, never by rebuilding the `d` string per
   frame. Rebuilding forces a full path re-parse and a layout-
   layer repaint every frame; translating a pre-built path stays
   on the compositor.

   The path spans FOUR periods and is translated by exactly two
   to loop, so the seam falls on an identical phase and is
   invisible. */

export const WAVE = {
  /** Horizontal length of one period, in viewBox units. */
  period: 720,
  /** Periods drawn. Four, so a two-period translate loops seamlessly. */
  periods: 4,
  /** Sample spacing. 24 units is ~30 points per period, past that the extra
   *  vertices cost path length without being visible. */
  step: 24,
} as const;

export const WAVE_WIDTH = WAVE.period * WAVE.periods;

/**
 * An SVG path for one sine wave across `WAVE_WIDTH`.
 *
 * @param midY      vertical centre, in viewBox units
 * @param amplitude peak height, in viewBox units
 * @param phase     offset in radians, to separate stacked lines
 */
export function wavePath(midY: number, amplitude: number, phase = 0): string {
  const points: string[] = [];
  for (let x = 0; x <= WAVE_WIDTH; x += WAVE.step) {
    const y = midY + Math.sin((x / WAVE.period) * Math.PI * 2 + phase) * amplitude;
    // Quantised: Math.sin is not required to be correctly rounded and can differ
    // in the last ulp between the Node build that renders the HTML and the
    // browser that hydrates it, which React reports as a hydration mismatch.
    points.push(`${x},${Math.round(y * 1e3) / 1e3}`);
  }
  return `M ${points.join(" L ")}`;
}
