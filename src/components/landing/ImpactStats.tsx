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
    { ...parseStatValue(content.statYears, 13, "+"),     label: "Years delivering",  sub: "Since 2013, without a missed SLA" },
    { ...parseStatValue(content.statClients, 50, "+"),   label: "Enterprise clients", sub: "Across North America" },
    { ...parseStatValue(content.statRetention, 98, "%"), label: "Client retention",  sub: "Year over year" },
    { ...parseStatValue(content.statOffices, 4, ""),     label: "Global offices",    sub: "US · India · UK delivery centers" },
  ];

  return (
    <section className="relative w-full overflow-hidden border-y border-slate-200/70 bg-[var(--hz-ivory)] py-24 sm:py-32">
      <div ref={ref} className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 sm:px-8 lg:grid-cols-12 lg:gap-12 2xl:max-w-[96rem]">
        {/* Heading — left */}
        <Reveal className="lg:col-span-5">
          <span aria-hidden className="block h-[3px] w-12 rounded-full bg-[var(--hz-amber)]" />
          <h2 className="hz-display mt-7 text-[2rem] leading-[1.08] text-[var(--hz-text)] sm:text-[2.75rem]">
            {content.statsHeading || "Over a decade of delivery, one accountable team."}
          </h2>
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-[var(--hz-text-mute)]">
            {content.statsSubtitle ||
              "Headquartered in Powell, Ohio — trusted by enterprises and state government agencies across North America, held to one standard of delivery."}
          </p>
        </Reveal>

        {/* Stat tiles — right, a connected 2×2 grid with hairline borders only */}
        <Stagger className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/40 lg:col-span-7" gap={0.1}>
          {stats.map((s, i) => (
            <StaggerItem
              key={s.label}
              className={`group p-4 transition-colors duration-300 hover:bg-white sm:p-8 ${
                i % 2 === 0 ? "border-r border-slate-200/80" : ""
              } ${i < 2 ? "border-b border-slate-200/80" : ""}`}
            >
              <p className="hz-display hz-tnum text-[2.15rem] leading-none text-[var(--hz-text)] sm:text-[3.25rem]">
                <Counter target={s.value} run={inView} />
                <span className="text-[var(--hz-amber)]">{s.suffix}</span>
              </p>
              <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--hz-text)]">{s.label}</p>
              <p className="mt-1.5 text-[13px] leading-snug text-[var(--hz-text-mute)]">{s.sub}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
