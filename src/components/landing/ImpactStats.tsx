"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Reveal } from "./motion/Primitives";
import { ArcSweep, IllYears, IllBuildings, IllLoop, IllGlobe } from "./motifs/Motifs";

/* ============================================================
   Proof — customer.io's "Enterprise ready" band.

   Theirs: a dark section, a centred eyebrow and heading, then a
   single bordered grid whose cells are divided by hairlines rather
   than floating as separate cards. One frame, several panes. It
   reads as a specification sheet, which is the right register for
   the part of a page that answers "can you actually be trusted
   with this?".

   The accreditations used to live in this band too. They now sit in
   a strip directly above the footer, which is where the reference
   site parks its trust marks — they are the last thing you pass on
   the way out, not a competitor to the figures.

   The count-up runs once the panel is in view, never for
   prefers-reduced-motion.
   ============================================================ */

type Stat = { value: number; suffix: string; label: string; sub: string; Motif: (p: { className?: string }) => React.ReactElement };

function parseStatValue(raw: string | undefined, fallbackValue: number, fallbackSuffix: string) {
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
    const dur = 1400;
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
    // Each drawing depicts its own figure — growth rings for years, towers
    // for clients, a closing loop for retention, a globe for where the work
    // physically happens. None of them is interchangeable with another.
    { ...parseStatValue(content.statYears, 13, "+"), label: "Years delivering", sub: "Since 2013, without a missed SLA", Motif: IllYears },
    { ...parseStatValue(content.statClients, 50, "+"), label: "Enterprise clients", sub: "Across North America", Motif: IllBuildings },
    { ...parseStatValue(content.statRetention, 98, "%"), label: "Client retention", sub: "Year over year", Motif: IllLoop },
    { ...parseStatValue(content.statOffices, 4, ""), label: "Delivery centres", sub: "US, India and UK", Motif: IllGlobe },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-[var(--hz-ink)] py-20 sm:py-24 lg:py-28">
      {/* The mark's wave, enlarged into the corner of the band. */}
      <ArcSweep className="pointer-events-none absolute -left-24 bottom-0 h-[420px] w-[420px] text-[var(--hz-aqua)] opacity-[0.10]" />
      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="hz-eyebrow text-[var(--hz-aqua)]">
            Enterprise ready
          </span>
          <h2 className="hz-display hz-h2 mt-4 text-white">
            Thirteen years of delivery, and the paperwork to prove it.
          </h2>
        </Reveal>

        {/* One frame, hairline-divided panes — not four floating cards. The
            outer ring is the object; the dividers are its internal structure. */}
        <div
          ref={ref}
          className="mt-12 grid overflow-hidden rounded-2xl border border-white/[0.12] sm:mt-14 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`relative overflow-hidden p-7 sm:p-8 ${i % 2 === 0 ? "sm:border-r sm:border-white/[0.12]" : ""} ${
                i < 2 ? "sm:border-b sm:border-white/[0.12]" : ""
              } lg:border-b-0 lg:border-r lg:border-white/[0.12] lg:last:border-r-0`}
            >
              {/* The drawing leads the pane, at full strength. Line in white
                  at reading weight, accent solid in the logo's light blue —
                  a coloured illustration, not a watermark behind the number. */}
              <s.Motif className="h-10 w-10 text-white/45 [--motif-accent:var(--hz-aqua)]" />
              <p className="relative hz-display hz-tnum mt-6 text-[clamp(2.2rem,5vw,3.1rem)] leading-none text-white">
                <Counter target={s.value} run={inView} />
                <span className="text-[var(--hz-aqua)]">{s.suffix}</span>
              </p>
              <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-white">
                {s.label}
              </p>
              <p className="mt-1.5 text-[13px] leading-snug text-white/55">{s.sub}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
