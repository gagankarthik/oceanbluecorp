"use client";

import { motion, useReducedMotion } from "motion/react";
import { DUR, EASE } from "@/lib/motion";

/* ============================================================
   CornerArches, a gold pillar-and-arch framing the anniversary
   band at its four corners.

   The device is a mandapa / Indo-Islamic pavilion: a slender
   column with a moulded base and bracketed capital, and a
   cusped (multifoil) arch springing from that capital toward
   the centre. Four of them, mirrored into each corner, so the
   section reads as being seen THROUGH a pavilion rather than
   decorated at the edges. That is also why it beats the
   medallion it replaced, a medallion is an object sitting in
   the margin; an arch is architecture the content occupies.

   Ocean Blue has run a delivery centre in India since 2022, so
   on the page about the company's own thirteen years the
   reference is pointed rather than borrowed.

   Everything is constructed, not traced. The cusp lobes are
   generated along the arch envelope, so the number of foils and
   the arch profile are parameters rather than a fixed path
   string. Coordinates are quantised to 3dp: Math.cos/sin and
   the interpolation below are not guaranteed bit-identical
   between the Node render and the browser hydration, which
   React reports as a mismatch on every derived coordinate.
   ============================================================ */

const W = 260;
const H = 260;

const q = (n: number) => Math.round(n * 1e3) / 1e3;

/* ── The column ─────────────────────────────────────────────
   Read bottom-up as a mason would: plinth, base mouldings,
   shaft with a centre fillet, then the capital brackets. */
const COL_X = 44;
const SHAFT_HALF = 6;
const CAP_Y = 68;
const BASE_Y = 238;

/** Horizontal moulding: a stack of lines, widest at the outside. */
const moulding = (y: number, halfWidth: number) =>
  `M ${q(COL_X - halfWidth)},${q(y)} L ${q(COL_X + halfWidth)},${q(y)}`;

const COLUMN = [
  // Shaft
  `M ${COL_X - SHAFT_HALF},${CAP_Y} L ${COL_X - SHAFT_HALF},${BASE_Y}`,
  `M ${COL_X + SHAFT_HALF},${CAP_Y} L ${COL_X + SHAFT_HALF},${BASE_Y}`,
  // Capital: three brackets corbelling outward
  moulding(CAP_Y, 15),
  moulding(CAP_Y + 7, 12),
  moulding(CAP_Y + 13, 9),
  // Base: mirrored, plus a plinth
  moulding(BASE_Y, 9),
  moulding(BASE_Y + 6, 12),
  moulding(BASE_Y + 12, 16),
];

/* ── The cusped arch ────────────────────────────────────────
   The envelope is a quadratic from the capital to the tile's
   inner edge; lobes are semicircles struck between consecutive
   samples along it, bulging INTO the opening (sweep 0 travelling
   left to right), which is what makes a multifoil read as
   scalloped rather than as a bumpy line. */
const FOILS = 5;
const SPRING = { x: COL_X + 2, y: CAP_Y - 2 };
const APEX = { x: W + 6, y: 14 };
/** Control point pulled up and left, so the curve leaves the capital steeply
 *  and flattens toward the crown, the proportion of a real arch, not an arc. */
const CTRL = { x: COL_X + 58, y: 4 };

function quadAt(t: number) {
  const u = 1 - t;
  return {
    x: q(u * u * SPRING.x + 2 * u * t * CTRL.x + t * t * APEX.x),
    y: q(u * u * SPRING.y + 2 * u * t * CTRL.y + t * t * APEX.y),
  };
}

const ARCH_CUSPED = (() => {
  const pts = Array.from({ length: FOILS + 1 }, (_, i) => quadAt(i / FOILS));
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const r = q(Math.hypot(b.x - a.x, b.y - a.y) / 2);
    d += ` A ${r},${r} 0 0 0 ${b.x},${b.y}`;
  }
  return d;
})();

/** A plain companion curve just outside the foils, the extrados, the outer
 *  face of the arch ring. Gives the arch thickness without a fill. */
const ARCH_EXTRADOS = (() => {
  const pts = Array.from({ length: 13 }, (_, i) => quadAt(i / 12));
  return `M ${pts.map((p) => `${p.x},${q(p.y - 11)}`).join(" L ")}`;
})();

/** Spandrel fill: short rays in the triangle above the arch, the way carved
 *  stonework breaks up that corner. */
const SPANDREL = Array.from({ length: 4 }, (_, i) => {
  const t = 0.18 + i * 0.16;
  const on = quadAt(t);
  const len = 13 - i * 1.6;
  return `M ${on.x},${q(on.y - 13)} L ${on.x},${q(on.y - 13 - len)}`;
});

type Corner = "tl" | "tr" | "bl" | "br";

const FLIP: Record<Corner, string> = {
  tl: "none",
  tr: "scaleX(-1)",
  bl: "scaleY(-1)",
  br: "scale(-1, -1)",
};

/* The top pair is pushed clear of the site header.

   This section is the first on the page and its top edge sits at y≈40 (under
   the announcement bar), while the fixed header occupies down to ~112px. An
   arch springs UPWARD toward its crown, so anchored at `top-0` the entire
   sweep, everything the shape is actually about, renders behind the header
   and only the springing curl at the capital escapes. The column reads fine
   either way, which is what makes this easy to miss.

   The bottom pair has no such constraint and stays flush. */
const PLACE: Record<Corner, string> = {
  tl: "left-0 top-20 lg:top-24",
  tr: "right-0 top-20 lg:top-24",
  bl: "left-0 bottom-0",
  br: "right-0 bottom-0",
};

function Arch({ corner, delay = 0 }: { corner: Corner; delay?: number }) {
  const reduce = useReducedMotion();

  /* Drawn in build order, column first, then the arch it carries, then the
     carving. `pathLength` rules each line on rather than fading it in. */
  const draw = (i: number) => ({
    initial: reduce ? { opacity: 0 } : { pathLength: 0, opacity: 0 },
    whileInView: reduce ? { opacity: 1 } : { pathLength: 1, opacity: 1 },
    viewport: { once: true, margin: "-6% 0px" },
    transition: {
      duration: reduce ? DUR.tap : DUR.reveal,
      delay: delay + i * 0.05,
      ease: EASE,
    },
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`pointer-events-none absolute select-none ${PLACE[corner]} h-[13rem] w-[13rem] lg:h-[17rem] lg:w-[17rem] xl:h-[20rem] xl:w-[20rem]`}
      style={{ transform: FLIP[corner] }}
      fill="none"
      aria-hidden
      focusable="false"
    >
      <g
        stroke="var(--hz-gold, #c9a227)"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        {COLUMN.map((d, i) => (
          <motion.path
            key={`c-${i}`}
            d={d}
            strokeWidth={i < 2 ? 1 : 0.85}
            strokeOpacity={i < 2 ? 0.42 : 0.3}
            {...draw(i * 0.35)}
          />
        ))}

        <motion.path
          d={ARCH_CUSPED}
          strokeWidth={1.15}
          strokeOpacity={0.48}
          {...draw(3.2)}
        />
        <motion.path
          d={ARCH_EXTRADOS}
          strokeWidth={0.75}
          strokeOpacity={0.26}
          {...draw(3.8)}
        />

        {SPANDREL.map((d, i) => (
          <motion.path
            key={`s-${i}`}
            d={d}
            strokeWidth={0.7}
            strokeOpacity={0.22}
            {...draw(4.4 + i * 0.12)}
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * All four corners. Drop into any `relative` section.
 *
 * Hidden below `md`: a phone has no margin for this to occupy, so the arches
 * would sit behind the copy instead of around it.
 */
export default function CornerArches({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 hidden select-none md:block ${className}`}
    >
      {/* Staggered so the frame assembles corner by corner rather than all at
          once, which at four identical figures reads as a flicker. */}
      <Arch corner="tl" delay={0.3} />
      <Arch corner="tr" delay={0.42} />
      <Arch corner="bl" delay={0.54} />
      <Arch corner="br" delay={0.66} />
    </div>
  );
}
