"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { WAVE_WIDTH, wavePath } from "@/lib/motion";
import { readScroll } from "@/lib/scroll-signal";

/* ============================================================
   WaveField, the site's one background motif.

   Replaces three drop-in backgrounds from component
   marketplaces (a honeycomb, a synthwave grid, a WebGL ocean)
   that shared no visual language with each other or with the
   brand. This is built from the logo's wave, it is the same
   motif everywhere it appears, and it costs no WebGL context
   and no shader.

   ── Why it feels alive ──────────────────────────────────────
   The waves travel continuously, but their AMPLITUDE answers to
   scroll velocity: still when the page is still, swelling as
   you scroll, settling back as you stop. That is the whole
   trick behind "the site feels better when you keep scrolling"
  , the background acknowledges the input rather than looping
   past it indifferently.

   ── Why it is cheap ─────────────────────────────────────────
   Three things, all deliberate:

   1. Path strings are built ONCE at module load and animated
      with transforms only. Rebuilding `d` per frame re-parses
      the path and repaints off the compositor; translating a
      built path does not.
   2. The loop reads scroll velocity from a plain module object
      rather than React state, so a frame costs two style writes
      per line and no render.
   3. It stops completely when off-screen, and never starts
      under prefers-reduced-motion, where it renders as a
      still, which is a perfectly good background.
   ============================================================ */

const VIEW_H = 240;

/** Four lines, each with its own phase, depth and travel speed. Speeds are
 *  deliberately non-integer multiples of each other so the stack never lands
 *  back in its starting arrangement and the loop stays unreadable. */
/* Speeds are roughly a third of the first pass, which read as a current rather
   than a swell. At rest the field should be almost subliminal, you notice it
   has moved, not that it is moving. */
const LINES = [
  { midY: 120, amp: 30, phase: 0, speed: 0.0065, opacity: 0.5, width: 1.6 },
  { midY: 132, amp: 24, phase: 1.9, speed: 0.0102, opacity: 0.34, width: 1.3 },
  { midY: 146, amp: 34, phase: 3.6, speed: 0.0047, opacity: 0.22, width: 1.1 },
  { midY: 158, amp: 20, phase: 5.2, speed: 0.0139, opacity: 0.14, width: 1.0 },
] as const;

const PATHS = LINES.map((l) => wavePath(l.midY, l.amp, l.phase));

/** Half the drawn width, translating by exactly this lands on an identical
 *  phase, so the wrap is invisible. */
const LOOP = WAVE_WIDTH / 2;

/** How far amplitude can swell above rest at full scroll intensity. Halved from
 *  the first pass: at 0.9 a firm flick nearly doubled the wave height, which
 *  drew the eye down to the background at exactly the moment the reader was
 *  moving through content. The response should be felt, not watched. */
const SWELL = 0.45;

/** Approach rate toward the target amplitude, per frame. Deliberately low so
 *  the swell lags the scroll and, more importantly, so it takes about a second
 *  to settle afterwards. Water has inertia; an instant response reads as a
 *  slider being dragged. Lowered further for calm, the lag IS the calm. */
const EASING = 0.03;

/** Extra travel speed at full scroll intensity, as a multiplier. Was 2.2, which
 *  made a fast scroll visibly whip the field sideways. */
const PUSH = 0.9;

export default function WaveField({
  className = "",
  color = "var(--hz-cobalt)",
  intensity = 1,
}: {
  className?: string;
  /** Stroke colour. Pass a light value on dark grounds. */
  color?: string;
  /** Per-section multiplier on the whole field's presence. */
  intensity?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<(SVGGElement | null)[]>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const host = hostRef.current;
    if (!host) return;

    let raf = 0;
    let visible = true;
    // Per-line travel, and one shared amplitude that chases scroll intensity.
    const offsets = LINES.map(() => 0);
    let amp = 1;

    const frame = () => {
      const { intensity: scrollIntensity } = readScroll();
      const target = 1 + scrollIntensity * SWELL;
      amp += (target - amp) * EASING;

      for (let i = 0; i < LINES.length; i++) {
        const g = groupRefs.current[i];
        if (!g) continue;
        // Travel speeds up with the scroll too, so the field reads as being
        // pushed rather than merely stretched.
        offsets[i] = (offsets[i] + LINES[i].speed * (1 + scrollIntensity * PUSH)) % 1;
        // scaleY about the line's own midpoint, so it swells symmetrically
        // instead of growing downward off the band.
        g.setAttribute(
          "transform",
          `translate(${-offsets[i] * LOOP} 0) translate(0 ${LINES[i].midY}) scale(1 ${amp.toFixed(3)}) translate(0 ${-LINES[i].midY})`,
        );
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    // A background nobody can see must not cost a frame.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      visible ? start() : stop();
    });
    io.observe(host);

    const onVisibility = () => {
      document.hidden || !visible ? stop() : start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduce]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <svg
        // Twice the container width, so a half-width translate always has drawn
        // path to move into and the field never runs out on the trailing edge.
        className="absolute inset-y-0 left-0 h-full w-[200%]"
        viewBox={`0 0 ${WAVE_WIDTH} ${VIEW_H}`}
        preserveAspectRatio="none"
        fill="none"
      >
        {LINES.map((l, i) => (
          <g
            key={i}
            ref={(el) => {
              groupRefs.current[i] = el;
            }}
          >
            <path
              d={PATHS[i]}
              stroke={color}
              strokeOpacity={l.opacity * intensity}
              strokeWidth={l.width}
              strokeLinecap="round"
              // The path is stretched horizontally by preserveAspectRatio="none";
              // without this the stroke stretches with it and the lines come out
              // visibly thicker on one axis.
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
