"use client";

import { motion, useReducedMotion } from "framer-motion";
import { yearsThrough } from "@/lib/company";
import { ANNIVERSARY_YEAR } from "@/lib/anniversary";

/* ============================================================
   YearArc — 2013 · 2014 … 2026 set around an open ring, with the
   arc drawing itself in on scroll and the closing year picked
   out in cobalt. Lifted from the celebration artwork, where the
   years wrap from roughly 8 o'clock, over the top, round to
   4 o'clock, leaving the ring open at the bottom.

   Geometry, all of it load-bearing:

   - The ring is a 220° arc of radius R about (CX, CY). 220° is
     what leaves the bottom open the way the artwork does; a
     plain semicircle reads as a dome and wastes the space the
     numeral needs.
   - The years ride a SEPARATE path 26 units outside the stroke,
     so they sit clear above the rail rather than resting on it.
   - Type size is capped at 21. Text arc length is 306 × 3.84 ≈
     1175 units and fourteen four-digit years plus separators run
     to ~960 — about 100 units of clearance at each end for the
     terminal dots. Push the size past ~23 and the run overflows
     the arc, at which point the tail is silently clipped and the
     closing year, the one the whole graphic is about, is the
     first thing to vanish.
   - The viewBox is trimmed to what is actually drawn (glyph tops
     at y≈22, dots at y≈452) so the caller's aspect-ratio box has
     no dead margin to centre the numeral against.

   aria-hidden throughout: the same years are announced by the
   milestone list below, and a screen reader reading fourteen
   bare numbers helps nobody.
   ============================================================ */

const YEARS = yearsThrough(ANNIVERSARY_YEAR);

const CX = 350;
const CY = 350;
const R = 280;
const TEXT_R = R + 26;

/** Point on the ring at `deg`, measured from the positive x-axis with y down.
 *
 *  Quantised to 3dp on purpose. Math.cos/Math.sin are not required to be
 *  correctly rounded, and V8 can differ in the last ulp between the Node build
 *  that renders the HTML and the browser build that hydrates it — which React
 *  reports as a hydration mismatch on every coordinate derived from them. The
 *  same bug had to be patched in the vendored hexagon pattern. */
function at(deg: number, radius: number) {
  const rad = (deg * Math.PI) / 180;
  const q = (n: number) => Math.round(n * 1e3) / 1e3;
  return { x: q(CX + radius * Math.cos(rad)), y: q(CY + radius * Math.sin(rad)) };
}

/** 160° → 20° travelling clockwise on screen, i.e. up and over the top. */
function ringPath(radius: number) {
  const a = at(160, radius);
  const b = at(20, radius);
  // large-arc=1 (the sweep is 220°, over half the circle), sweep=1 (clockwise).
  return `M ${a.x},${a.y} A ${radius},${radius} 0 1 1 ${b.x},${b.y}`;
}

const ARC = ringPath(R);
const TEXT_ARC = ringPath(TEXT_R);
const START = at(160, R);
const END = at(20, R);

const EASE = [0.22, 1, 0.36, 1] as const;

function Dot({ x, y, fill, delay }: { x: number; y: number; fill: string; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={6.5}
      fill={fill}
      initial={reduce ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ type: "spring", stiffness: 300, damping: 15, delay }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    />
  );
}

export default function YearArc({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <svg
      viewBox="0 0 700 480"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      fill="none"
      aria-hidden
      focusable="false"
    >
      <defs>
        <path id="hz-year-arc-text" d={TEXT_ARC} />
        <linearGradient id="hz-arc-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.22" />
          <stop offset="50%" stopColor="#1d4ed8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#2ad8ef" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* The rail itself, drawn 2013 → 2026 on scroll into view */}
      <motion.path
        d={ARC}
        stroke="url(#hz-arc-stroke)"
        strokeWidth={2.5}
        strokeLinecap="round"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 1.9, ease: EASE }}
      />

      <Dot x={START.x} y={START.y} fill="#1d4ed8" delay={0.15} />
      <Dot x={END.x} y={END.y} fill="#2ad8ef" delay={1.75} />

      <text
        className="hz-tnum"
        fill="#64748b"
        fontSize={21}
        letterSpacing="0.6"
        style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif", fontWeight: 500 }}
      >
        <textPath href="#hz-year-arc-text" startOffset="50%" textAnchor="middle">
          {YEARS.map((y, i) => {
            const isLast = y === ANNIVERSARY_YEAR;
            return (
              <motion.tspan
                key={y}
                fill={isLast ? "#1d4ed8" : undefined}
                fontSize={isLast ? 26 : undefined}
                fontWeight={isLast ? 700 : undefined}
                initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                // Years light up in step with the arc sweeping past them.
                transition={{ duration: 0.4, delay: 0.25 + i * 0.11 }}
              >
                {i === 0 ? "" : " · "}
                {y}
              </motion.tspan>
            );
          })}
        </textPath>
      </text>
    </svg>
  );
}
