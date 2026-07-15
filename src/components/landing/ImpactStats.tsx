"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Reveal } from "./motion/Primitives";

type Stat = { value: number; suffix?: string; label: string; sub: string };

const EASE = [0.22, 1, 0.36, 1] as const;

// Parse a CMS value like "50+", "98%", "1,200" into { value, suffix } for the
// count-up. Falls back to the provided defaults when empty/non-numeric.
function parseStatValue(raw: string | undefined, fallbackValue: number, fallbackSuffix: string): { value: number; suffix: string } {
  if (!raw) return { value: fallbackValue, suffix: fallbackSuffix };
  const m = raw.trim().match(/^(\d[\d,]*)(.*)$/);
  if (!m) return { value: fallbackValue, suffix: fallbackSuffix };
  return { value: parseInt(m[1].replace(/,/g, ""), 10), suffix: (m[2] || "").trim() };
}

function Counter({ target, run }: { target: number; run: boolean }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? target : 0);
  useEffect(() => {
    if (!run || reduce) {
      setN(target);
      return;
    }
    const dur = 1600;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target, reduce]);
  return <>{n}</>;
}

export default function ImpactStats({ content = {} }: { content?: Record<string, string> }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  const stats: Stat[] = [
    { ...parseStatValue(content.statYears, 13, "+"),     label: "Years delivering",  sub: "Since 2013, without a missed SLA" },
    { ...parseStatValue(content.statClients, 50, "+"),   label: "Enterprise clients", sub: "Across North America" },
    { ...parseStatValue(content.statRetention, 98, "%"), label: "Client retention",  sub: "Year over year" },
    { ...parseStatValue(content.statOffices, 4, ""),     label: "Global offices",    sub: "US · India · UK centers" },
  ];

  return (
    <section className="relative w-full overflow-hidden border-y border-slate-200/70 bg-[var(--hz-ivory)] py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 60% at 50% 0%, rgba(29,78,216,0.05), transparent 65%)" }}
      />
      <div ref={ref} className="relative mx-auto max-w-7xl px-6 sm:px-8 2xl:max-w-[92rem]">
        <Reveal className="max-w-3xl">
          <h2 className="hz-display text-[2rem] leading-[1.08] text-[var(--hz-text)] sm:text-[2.85rem]">
            {content.statsHeading || "Over a decade of delivery, one accountable team."}
          </h2>
          <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-[var(--hz-text-mute)]">
            {content.statsSubtitle ||
              "Headquartered in Powell, Ohio — trusted by enterprises and state government agencies across North America, held to one standard of delivery."}
          </p>
        </Reveal>

        {/* Stat ribbon — big numbers with scroll-animated accent bars */}
        <div className="mt-16 grid grid-cols-1 gap-y-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12% 0px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: EASE }}
              className="relative lg:px-8 lg:first:pl-0"
            >
              {/* Vertical hairline between columns on large screens */}
              {i > 0 && (
                <span aria-hidden className="absolute left-0 top-2 hidden h-[calc(100%-0.5rem)] w-px bg-slate-200/80 lg:block" />
              )}
              {/* Animated top accent bar */}
              <motion.span
                aria-hidden
                className="block h-[3px] w-14 origin-left rounded-full bg-[var(--hz-cobalt)]"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: "-12% 0px" }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: EASE }}
              />
              <p className="hz-display hz-tnum mt-6 text-[3rem] leading-none text-[var(--hz-text)] sm:text-[4rem]">
                <Counter target={s.value} run={inView} />
                <span className="text-[var(--hz-amber)]">{s.suffix}</span>
              </p>
              <p className="mt-5 text-[14px] font-semibold text-[var(--hz-text)]">{s.label}</p>
              <p className="mt-1.5 text-[13.5px] leading-snug text-[var(--hz-text-mute)]">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
