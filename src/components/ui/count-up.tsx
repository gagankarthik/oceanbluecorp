"use client";

/* Count-up from 21st.dev (unlumen/count-up), trimmed to the "none" and "blur"
   digit effects so it needs only `motion`. Springs to `to` once in view. */

import * as React from "react";
import { AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useSpring } from "motion/react";

import { cn } from "@/lib/utils";

type DigitEffect = "none" | "blur";

interface CountUpProps {
  to: number;
  from?: number;
  delay?: number;
  duration?: number;
  digitEffect?: DigitEffect;
  className?: string;
  separator?: string;
}

function CharSlot({ char, charKey }: { char: string; charKey: string }) {
  if (!/\d/.test(char)) return <span style={{ display: "inline-block" }}>{char}</span>;
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={charKey}
          initial={{ opacity: 0, filter: "blur(8px)", y: -8 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          exit={{ opacity: 0, filter: "blur(8px)", y: 8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          style={{ display: "inline-block" }}
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function CountUp({ to, from = 0, delay = 0, duration = 2, digitEffect = "none", className, separator = "" }: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(from);
  const springValue = useSpring(motionValue, { damping: 20 + 40 / duration, stiffness: 100 / duration });
  const isInView = useInView(ref, { once: true });

  const format = React.useCallback(
    (v: number) => {
      const s = Intl.NumberFormat("en-US", { useGrouping: !!separator, maximumFractionDigits: 0 }).format(v);
      return separator ? s.replace(/,/g, separator) : s;
    },
    [separator],
  );

  const [chars, setChars] = React.useState(() => format(from).split(""));

  React.useEffect(() => {
    if (!isInView) return;
    if (reduce) {
      springValue.jump(to);
      return;
    }
    const t = setTimeout(() => motionValue.set(to), delay * 1000);
    return () => clearTimeout(t);
  }, [isInView, reduce, motionValue, springValue, to, delay]);

  React.useEffect(
    () =>
      springValue.on("change", (v) => {
        if (digitEffect === "none") {
          if (ref.current) ref.current.textContent = format(v);
        } else {
          setChars(format(v).split(""));
        }
      }),
    [springValue, format, digitEffect],
  );

  if (digitEffect === "none") {
    return (
      <span ref={ref} className={className}>
        {format(from)}
      </span>
    );
  }
  return (
    <span ref={ref} className={cn("inline-flex items-center", className)} style={{ fontVariantNumeric: "tabular-nums" }}>
      {chars.map((c, i) => (
        <CharSlot key={i} char={c} charKey={`${i}-${c}`} />
      ))}
    </span>
  );
}

export { CountUp, type CountUpProps };
export default CountUp;
