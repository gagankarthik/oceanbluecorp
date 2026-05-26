"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Reveal, Stagger, StaggerItem } from "./motion/Primitives";

type Stat = { value: number; suffix?: string; label: string; sub: string };

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
    const dur = 1500;
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
    { ...parseStatValue(content.statYears, 10, "+"),     label: "Years delivering",  sub: "Since 2014, without a missed SLA" },
    { ...parseStatValue(content.statClients, 50, "+"),   label: "Enterprise clients", sub: "Across North America" },
    { ...parseStatValue(content.statRetention, 98, "%"), label: "Client retention",  sub: "Year over year" },
    { ...parseStatValue(content.statOffices, 4, ""),     label: "Global offices",    sub: "US · India delivery centers" },
  ];

  return (
    <section className="relative w-full overflow-hidden border-y border-slate-200/70 bg-[var(--hz-ivory)] py-24 sm:py-32">
      <div ref={ref} className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 sm:px-8 lg:grid-cols-12 lg:gap-12">
        {/* Heading — left */}
        <Reveal className="lg:col-span-5">
          <span aria-hidden className="block h-[3px] w-12 rounded-full bg-[var(--hz-amber)]" />
          <h2 className="hz-display mt-7 text-[2rem] leading-[1.08] text-[var(--hz-text)] sm:text-[2.75rem]">
            {content.statsHeading || "A decade of delivery, one accountable team."}
          </h2>
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-[var(--hz-text-mute)]">
            {content.statsSubtitle ||
              "Headquartered in Powell, Ohio — trusted by enterprise and public-sector clients across North America, on a single SLA."}
          </p>
        </Reveal>

        {/* Stat cards — right, 2×2 */}
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:col-span-7" gap={0.1}>
          {stats.map((s) => (
            <StaggerItem key={s.label}>
              <div className="group h-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-slate-300/80 hover:shadow-md sm:p-7">
                <p className="hz-display hz-tnum text-[2.75rem] leading-none text-[var(--hz-text)] sm:text-[3.25rem]">
                  <Counter target={s.value} run={inView} />
                  <span className="text-[var(--hz-amber)]">{s.suffix}</span>
                </p>
                <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--hz-text)]">{s.label}</p>
                <p className="mt-1.5 text-[13px] leading-snug text-[var(--hz-text-mute)]">{s.sub}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
