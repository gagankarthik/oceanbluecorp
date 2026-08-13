"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/* ============================================================
   Confetti, one canvas burst, fired once when the anniversary
   section scrolls into view.

   Deliberately not a library: ~90 rectangles on a single canvas
   with one rAF loop that cancels itself the moment the last
   particle dies. No idle loop is left running behind the page.

   Palette is the brand (cobalt · cyan · navy) plus white, so it
   matches the celebration artwork rather than reading as a
   generic rainbow burst.
   ============================================================ */

/** For dark grounds. White and pale cyan carry against ink. */
export const CONFETTI_ON_DARK = ["#1d4ed8", "#2ad8ef", "#5ce0f7", "#6366f1", "#ffffff", "#93b4f7"];

/** For light grounds. The dark palette's white and pale cyan are effectively
 *  invisible on a near-white band, a third of the burst would simply not be
 *  there, so this substitutes saturated and deep blues that hold their edge. */
export const CONFETTI_ON_LIGHT = ["#1d4ed8", "#1740ad", "#0ea5e9", "#06b6d4", "#6366f1", "#0a1730"];

const COUNT = 90;
const GRAVITY = 0.055;
const DRAG = 0.994;
const FADE_AFTER = 0.62; // fraction of life before alpha starts dropping

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  color: string;
  life: number; // 0 → 1
  decay: number;
};

/** Builds the burst. Called only from inside the effect, never during render,
 *  the randomness here would otherwise differ between the server's HTML and the
 *  browser's hydration and trip a mismatch on every particle. */
function makeParticles(w: number, h: number, colors: string[], spread: number): Particle[] {
  // Two launch points either side of the mark, so the burst arcs up and over
  // the numeral instead of raining down on it.
  //
  // Offset in PIXELS from the centre, not as a fraction of width. The canvas
  // spans the full-bleed section while the mark is a fixed-width column in the
  // middle of it, so a percentage offset tracks the viewport instead of the
  // thing it is celebrating: on a wide screen the two bursts end up out at the
  // page margins, firing from empty space either side of the content.
  //
  // Clamped to 34% of the width so it still reads as "either side of the mark"
  // on a phone, where the mark is the full column.
  const dx = Math.min(spread, w * 0.34);
  const origins = [
    { x: w / 2 - dx, y: h * 0.45, aim: -0.5 },
    { x: w / 2 + dx, y: h * 0.45, aim: 0.5 },
  ];
  return Array.from({ length: COUNT }, (_, i) => {
    const o = origins[i % origins.length];
    const spread = (Math.random() - 0.5) * 0.9;
    const angle = -Math.PI / 2 + o.aim + spread;
    const speed = 4.4 + Math.random() * 4.8;
    const ribbon = Math.random() > 0.6;
    return {
      x: o.x + (Math.random() - 0.5) * 40,
      y: o.y + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: ribbon ? 3 : 6 + Math.random() * 5,
      h: ribbon ? 11 + Math.random() * 7 : 6 + Math.random() * 4,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.24,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      decay: 0.0052 + Math.random() * 0.004,
    };
  });
}

export default function Confetti({
  run,
  colors = CONFETTI_ON_LIGHT,
  spread = 300,
}: {
  run: boolean;
  /** Defaults to the light palette, both surfaces that use this today are
   *  light bands. Pass CONFETTI_ON_DARK on an ink ground. */
  colors?: string[];
  /** Pixels from centre to each launch point. Match it to the half-width of
   *  whatever the burst is celebrating (the anniversary mark is `max-w-[620px]`,
   *  hence 300). */
  spread?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const firedRef = useRef(false);

  useEffect(() => {
    // Reduced motion gets no burst at all, a confetti animation is exactly the
    // kind of thing the preference exists to suppress.
    if (!run || reduce || firedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    firedRef.current = true;

    // Size to the parent box at device pixel ratio, capped at 2, a 3x phone
    // would otherwise paint 9x the pixels for no visible gain.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement?.getBoundingClientRect();
    const w = rect?.width || canvas.clientWidth;
    const h = rect?.height || canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.scale(dpr, dpr);

    let particles = makeParticles(w, h, colors, spread);
    let raf = 0;

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      let alive = 0;

      for (const p of particles) {
        p.life += p.decay;
        if (p.life >= 1) continue;
        alive++;

        p.vy += GRAVITY;
        p.vx *= DRAG;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        const alpha =
          p.life < FADE_AFTER ? 1 : 1 - (p.life - FADE_AFTER) / (1 - FADE_AFTER);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        // Squash on the X axis by the rotation, so flat rectangles read as
        // tumbling foil rather than spinning bricks.
        ctx.fillRect(p.w / -2, p.h / -2, p.w * Math.abs(Math.cos(p.rot * 0.7)), p.h);
        ctx.restore();
      }

      if (alive > 0) {
        raf = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, w, h);
        particles = [];
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // `colors` is read once at burst time and the burst fires once; re-running
    // on a new array identity would refire it on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, reduce]);

  if (reduce) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
    />
  );
}
