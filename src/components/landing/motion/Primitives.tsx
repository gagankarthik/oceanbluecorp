"use client";

/* ============================================================
   Horizon motion primitives.
   Shared easing language over framer-motion; every primitive
   respects prefers-reduced-motion.
   ============================================================ */

import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
  type ElementType,
} from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/* Reveals animate opacity + transform ONLY. An animated `filter: blur()`
   repaints the whole subtree every frame, which is what made these stutter on
   scroll; transform/opacity stay on the compositor and run at 60fps. */

/** True when the viewport is below `px`. Used to shorten travel distances on
 *  phones, where a 28px rise reads as a lurch and costs more paint area. */
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

/* Reveal — fade + rise on scroll into view. */
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
      // Negative margins delayed the trigger until a section was already ~12%
      // into view, so content that had visibly arrived was still ghosted while
      // you read it. Firing slightly BEFORE the edge means it is solid by the
      // time it matters.
      viewport={{ once, margin: narrow ? "0px 0px -4% 0px" : "0px 0px -6% 0px" }}
      transition={{
        // Halved from 0.6/0.9. A reveal should confirm content has arrived,
        // not gate reading it.
        opacity: { duration: 0.35, delay, ease: "easeOut" },
        y: { duration: 0.5, delay, ease: EASE },
      }}
    >
      {children}
    </MotionTag>
  );
}

/* Stagger container + item. */
export function Stagger({
  children,
  className,
  gap = 0.09,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
  once?: boolean;
}) {
  const narrow = useIsNarrow();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: narrow ? "0px 0px -2% 0px" : "0px 0px -4% 0px" }}
      variants={{
        // On phones the cards stack vertically, so a long stagger means the last
        // card is still hidden well after it scrolls in — tighten it there.
        hidden: {},
        show: { transition: { staggerChildren: narrow ? gap * 0.4 : gap * 0.6, delayChildren: 0.03 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  const narrow = useIsNarrow();
  const dy = narrow ? Math.min(y, 14) : y;
  return (
    <motion.div
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
    </motion.div>
  );
}

/* Parallax — translate Y as the element crosses the viewport. */
export function Parallax({
  children,
  className,
  distance = 80,
  style,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yRaw = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const y = useSpring(yRaw, { stiffness: 120, damping: 30, mass: 0.4 });
  return (
    // `relative` so framer-motion's useScroll can compute the target's offset
    // (a static target triggers the "non-static position" warning).
    <div ref={ref} className={`relative ${className ?? ""}`} style={style}>
      <motion.div style={reduce ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

/* Tilt3D — pointer-reactive perspective tilt. */
export function Tilt3D({
  children,
  className,
  max = 9,
  style,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ rx: 0, ry: 0 });
  function onMove(e: React.MouseEvent) {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setT({ rx: -py * max, ry: px * max });
  }
  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={() => setT({ rx: 0, ry: 0 })}
      style={{ perspective: 900, ...style }}
    >
      <motion.div
        animate={{ rotateX: t.rx, rotateY: t.ry }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* WordsReveal — headline rising word-by-word. */
export function WordsReveal({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const narrow = useIsNarrow();
  const words = text.split(" ");
  // A headline wraps to many more lines on a phone, so the same per-word delay
  // would leave the last words arriving ~2s in. Tighten the cadence there.
  const step = narrow ? 0.035 : 0.06;
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}
        >
          <motion.span
            style={{ display: "inline-block", willChange: "transform, opacity" }}
            initial={reduce ? { opacity: 0 } : { y: "110%", opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { y: "0%", opacity: 1 }}
            transition={{
              duration: narrow ? 0.7 : 0.85,
              delay: (narrow ? delay * 0.6 : delay) + i * step,
              ease: EASE,
            }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
