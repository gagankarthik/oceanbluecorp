"use client";

/* Horizon motion primitives. Shared easing over framer-motion; every
   primitive respects prefers-reduced-motion. */

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode, type ElementType } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

// Reveals animate opacity and transform only, so they stay on the compositor.
// Do not add `filter: blur()`: it repaints the whole subtree every frame.

/** True when the viewport is below `px`. Used to shorten travel on phones,
 *  where a 28px rise reads as a lurch. */
function useIsNarrow(px = 640) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${px - 1}px)`);
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [px]);
  return narrow;
}

/* Reveal, fade + rise on scroll into view. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: ElementType;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  const narrow = useIsNarrow();
  const dy = narrow ? Math.min(y, 16) : y;
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      style={{ willChange: "transform, opacity" }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: dy }}
      whileInView={{ opacity: 1, y: 0 }}
      // Fires slightly before the viewport edge so content is solid by the
      // time it is readable, rather than ghosted while you read it.
      viewport={{ once, margin: narrow ? "0px 0px -4% 0px" : "0px 0px -6% 0px" }}
      transition={{
        opacity: { duration: 0.35, delay, ease: "easeOut" },
        y: { duration: 0.5, delay, ease: EASE },
      }}
    >
      {children}
    </MotionTag>
  );
}

/* Stagger container + item. Both take `as` so a staggered group can be a real
   <ul>/<li> rather than nested divs when the content is a list. */
export function Stagger({
  children,
  className,
  gap = 0.09,
  once = true,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
  once?: boolean;
  as?: ElementType;
}) {
  const narrow = useIsNarrow();
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: narrow ? "0px 0px -2% 0px" : "0px 0px -4% 0px" }}
      variants={{
        // Tighter on phones: cards stack vertically there, so a long stagger
        // leaves the last one hidden well after it has scrolled in.
        hidden: {},
        show: { transition: { staggerChildren: narrow ? gap * 0.4 : gap * 0.6, delayChildren: 0.03 } },
      }}
    >
      {children}
    </MotionTag>
  );
}

export function StaggerItem({
  children,
  className,
  y = 24,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  as?: ElementType;
}) {
  const reduce = useReducedMotion();
  const narrow = useIsNarrow();
  const dy = narrow ? Math.min(y, 14) : y;
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      style={{ willChange: "transform, opacity" }}
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: dy },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            opacity: { duration: 0.3, ease: "easeOut" },
            y: { duration: 0.45, ease: EASE },
          },
        },
      }}
    >
      {children}
    </MotionTag>
  );
}
