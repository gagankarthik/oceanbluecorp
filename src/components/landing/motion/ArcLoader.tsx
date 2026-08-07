"use client";

import { motion, useReducedMotion } from "framer-motion";
import { DUR, EASE_CYCLE } from "@/lib/motion";

/* ============================================================
   ArcLoader — the brand's pending state.

   Not a spinner. A spinner is the same rotating ring every
   product ships and says nothing; this is the anniversary
   mark's own gesture — an arc DRAWING around a ring — reused
   wherever the site is waiting.

   The arc both draws and rotates. Rotation alone reads as a
   spinner; drawing alone stalls visibly at the end of each
   cycle. Together the arc appears to chase itself, which holds
   attention through a slow request without ever looking stuck.

   Under prefers-reduced-motion it renders a static ring with a
   fixed cobalt segment: still legible as "working", with
   nothing moving.
   ============================================================ */

const R = 22;
const CIRC = 2 * Math.PI * R;

export default function ArcLoader({
  size = 56,
  label = "Loading",
  className = "",
}: {
  size?: number;
  /** Announced to screen readers. Say what is loading where it is known. */
  label?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`inline-grid place-items-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 56 56" width={size} height={size} fill="none" aria-hidden>
        {/* Track */}
        <circle cx="28" cy="28" r={R} stroke="var(--hz-line)" strokeWidth={2.5} />

        {/* Slow on purpose. A loader that whips round reads as anxious and, if
            the wait is real, as though something is going wrong. At ~3.4s per
            revolution it reads as patient — the same information, calmer. */}
        <motion.g
          style={{ originX: "28px", originY: "28px" }}
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: DUR.loop, ease: "linear", repeat: Infinity }}
        >
          <motion.circle
            cx="28"
            cy="28"
            r={R}
            stroke="var(--hz-cobalt)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            // Sweeps from a short arc to most of the ring and back. The two
            // stops are asymmetric (0.35 in, rest out) so the arc lengthens
            // faster than it retracts, which reads as effort rather than a
            // pendulum.
            initial={{ strokeDashoffset: CIRC * 0.92 }}
            animate={
              reduce
                ? { strokeDashoffset: CIRC * 0.72 }
                : { strokeDashoffset: [CIRC * 0.92, CIRC * 0.25, CIRC * 0.92] }
            }
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 2.6, ease: EASE_CYCLE, repeat: Infinity, times: [0, 0.38, 1] }
            }
          />
        </motion.g>
      </svg>
    </span>
  );
}
