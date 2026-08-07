"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DUR, EASE } from "@/lib/motion";
import { FOUNDED_YEAR } from "@/lib/company";
import { IMG, atWidth } from "../media";

/* ============================================================
   Numeral — the "13", with the photo collage showing through
   the strokes, as on the celebration artwork.

   ── Why this is safe now, having failed before ──────────────
   An earlier version used `background-clip: text` and was
   pulled because it FAILS INVISIBLY: if any layer of the
   background stack has not resolved, the glyph paints nothing
   at all — not a broken image, a transparent hole where the
   entire graphic should be.

   The technique is right (an SVG clipPath over <text> depends
   on the webfont having loaded before the clip is computed, so
   a late font swap cuts the mask to the wrong metrics). What
   was missing was a guard. So:

   - The photographs are decoded up front via the Image
     constructor, and the clip is only applied once they have
     all resolved.
   - Until then — and forever, if a request fails — the numeral
     renders as solid cobalt. There is no state in which the
     mark is absent.
   - `backgroundColor` sits under the stack and is clipped with
     it, so even a mid-session failure degrades to solid ink
     rather than to nothing.

   ── Why it no longer counts up ──────────────────────────────
   The count was dropped when the collage came back. Photo-
   filled digits changing 0→13 re-crop the collage on every
   tick, and the artwork this mirrors is a static mark. The
   entrance carries the motion instead, and the year ring
   drawing around it carries the sense of time.
   ============================================================ */

/** A 2 × 3 grid, so even the narrow stroke of the "1" crosses more than one
 *  photograph. 960px is ample: the numeral is ~350px at its largest. */
const PHOTOS = [
  IMG.heroSlides[1], // team meeting
  IMG.heroSlides[0], // open office
  IMG.serviceTalent, // collaborating
  IMG.caseStudy, // building
  IMG.heroSlides[2], // infrastructure
  IMG.aboutTeam, // team
].map((src) => atWidth(src, 960));

/** Layer order is top-down: the cobalt tint sits above the collage, which is
 *  what makes six unrelated photographs read as one blue mark. */
const COLLAGE = {
  backgroundImage: [
    "linear-gradient(160deg, rgba(29,78,216,0.58) 0%, rgba(10,23,48,0.68) 55%, rgba(29,78,216,0.54) 100%)",
    ...PHOTOS.map((p) => `url("${p}")`),
  ].join(", "),
  backgroundSize: ["100% 100%", ...PHOTOS.map(() => "50% 33.34%")].join(", "),
  backgroundPosition: [
    "0 0",
    "0% 0%",
    "100% 0%",
    "0% 50%",
    "100% 50%",
    "0% 100%",
    "100% 100%",
  ].join(", "),
  backgroundRepeat: "no-repeat",
  backgroundColor: "#1d4ed8",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
} as const;

/** Resolves once every photograph has decoded, or stays false if any fails. */
function useCollageReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    Promise.all(
      PHOTOS.map(
        (src) =>
          new Promise<boolean>((resolve) => {
            const img = new window.Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = src;
          }),
      ),
    ).then((results) => {
      // All-or-nothing: a partial collage leaves visibly empty bands across the
      // strokes, which looks broken in a way solid cobalt does not.
      if (live && results.every(Boolean)) setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  return ready;
}

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
  const collageReady = useCollageReady();

  return (
    <span className={`flex flex-col items-center ${className}`}>
      <motion.span
        role="img"
        aria-label={`${value} years, ${FOUNDED_YEAR} to ${FOUNDED_YEAR + value}`}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        animate={run ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        transition={{ duration: DUR.reveal, ease: EASE }}
        className="hz-display hz-tnum block select-none text-center leading-[0.78]"
        style={
          collageReady
            ? COLLAGE
            : // Solid cobalt until every photograph has decoded. This branch is
              // the whole reason the collage is safe to use at all.
              { color: "var(--hz-cobalt)" }
        }
      >
        {value}
      </motion.span>

      {/* Cyan rule — the artwork's accent, and a visual full stop under the
          number. Drawn after the numeral has settled. */}
      <motion.span
        aria-hidden
        className="mt-[0.12em] block h-[0.045em] rounded-full bg-[var(--hz-cyan)]"
        initial={{ width: 0 }}
        animate={{ width: run ? "0.62em" : 0 }}
        transition={{ duration: DUR.enter, delay: run ? 0.5 : 0, ease: EASE }}
        style={{ fontSize: "inherit" }}
      />
    </span>
  );
}
