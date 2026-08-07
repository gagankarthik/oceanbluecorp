"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FOUNDED_YEAR } from "@/lib/company";

/* ============================================================
   Numeral — the counting "13" at the centre of the year ring.

   This replaced a version that filled the glyphs with a photo
   collage via `background-clip: text`. That technique paints
   nothing at all if any part of the background stack fails to
   resolve, and it fails silently: you get a transparent glyph,
   not a broken image, so the mark simply is not there. On a
   celebration banner that is the whole graphic gone. The photo
   treatment now lives where it is safe — the artwork itself, on
   /13-years — and the coded mark is solid ink that cannot fail
   to render.

   The animation carries the celebration instead: the numeral
   springs in, counts 0 → 13, then settles with a pop on the
   final value and draws a cyan rule beneath it.
   ============================================================ */

const EASE = [0.22, 1, 0.36, 1] as const;
const COUNT_MS = 1600;

export default function Numeral({
  value,
  run = true,
  className = "",
}: {
  value: number;
  run?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);
  const [landed, setLanded] = useState(reduce);

  useEffect(() => {
    if (!run || reduce) {
      setN(value);
      setLanded(true);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / COUNT_MS, 1);
      // easeOutCubic — fast out of the gate, decelerating onto the final value
      // so the landing reads as arriving rather than stopping.
      setN(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setLanded(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, value, reduce]);

  return (
    <span className={`flex flex-col items-center ${className}`}>
      <motion.span
        // The accessible name is the final value: a screen reader should hear
        // "13 years", never the intermediate counts.
        role="img"
        aria-label={`${value} years, ${FOUNDED_YEAR} to ${FOUNDED_YEAR + value}`}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.86 }}
        animate={
          run
            ? { opacity: 1, scale: landed && !reduce ? [1.06, 1] : 1 }
            : { opacity: 0, scale: 0.86 }
        }
        transition={{
          opacity: { duration: 0.5, ease: "easeOut" },
          scale: landed && !reduce
            ? { duration: 0.5, ease: EASE }
            : { duration: 0.9, ease: EASE },
        }}
        // `hz-tnum` plus a reserved two-character box: without it the numeral's
        // width jumps when the count crosses 9 and drags the ring with it.
        className="hz-display hz-tnum block select-none text-center leading-[0.78] text-[var(--hz-cobalt)]"
        style={{ minWidth: "1.3em" }}
      >
        {n}
      </motion.span>

      {/* Cyan rule, drawn once the count lands — the artwork's accent, and a
          visual full stop under the number. */}
      <motion.span
        aria-hidden
        className="mt-[0.12em] block h-[0.045em] rounded-full bg-[var(--hz-cyan)]"
        initial={{ width: 0 }}
        animate={{ width: landed ? "0.62em" : 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        style={{ fontSize: "inherit" }}
      />
    </span>
  );
}
