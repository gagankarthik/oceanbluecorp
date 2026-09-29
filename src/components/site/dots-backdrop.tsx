"use client";

import { useReducedMotion } from "motion/react";
import { FlickeringGrid } from "@/components/ui/flickering-grid";

/**
 * The dot grid behind dark sections: light cobalt squares that flicker
 * faintly, fading out from the top so they never compete with the content.
 * Canvas-based and paints only while in view; skipped entirely under reduced
 * motion, where the section is simply navy.
 */
export function DotsBackdrop({
  color = "rgb(143, 180, 253)",
  maxOpacity = 0.16,
  mask = "[mask-image:radial-gradient(120%_90%_at_50%_0%,black,transparent_75%)]",
}: {
  color?: string;
  maxOpacity?: number;
  /** Tailwind mask class; defaults to fading out from the top. */
  mask?: string;
} = {}) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <FlickeringGrid
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 ${mask}`}
      squareSize={3}
      gridGap={8}
      flickerChance={0.12}
      maxOpacity={maxOpacity}
      color={color}
    />
  );
}
