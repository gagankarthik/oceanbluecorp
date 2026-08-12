"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Reveal } from "./motion/Primitives";

/* ============================================================
   Proof — customer.io's "Enterprise ready" band.

   Theirs: a dark section, a centred eyebrow and heading, then a
   single bordered grid whose cells are divided by hairlines rather
   than floating as separate cards. One frame, several panes. It
   reads as a specification sheet, which is the right register for
   the part of a page that answers "can you actually be trusted
   with this?".

   Ocean Blue's version merges what used to be two sections — the
   stat tiles and the certification row. Both answer that same
   question, and running them as separate bands said it twice.

   The count-up runs once the panel is in view, never for
   prefers-reduced-motion.
   ============================================================ */

type Stat = { value: number; suffix: string; label: string; sub: string };

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

const CERTS = [
  { name: "NMSDC", logo: "/logos/certifications/NMSDC.png", w: 340, h: 340, cls: "h-11" },
  { name: "Ohio WBE", logo: "/logos/certifications/wbe.png", w: 845, h: 202, cls: "h-8" },
  { name: "Ohio MBE", logo: "/logos/certifications/ohiombe.png", w: 734, h: 202, cls: "h-8" },
  { name: "MBE", logo: "/logos/certifications/mbe.png", w: 707, h: 353, cls: "h-9" },
];

export default function ImpactStats({ content = {} }: { content?: Record<string, string> }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  const stats: Stat[] = [
    { ...parseStatValue(content.statYears, 13, "+"), label: "Years delivering", sub: "Since 2013, without a missed SLA" },
    { ...parseStatValue(content.statClients, 50, "+"), label: "Enterprise clients", sub: "Across North America" },
    { ...parseStatValue(content.statRetention, 98, "%"), label: "Client retention", sub: "Year over year" },
    { ...parseStatValue(content.statOffices, 4, ""), label: "Delivery centres", sub: "US, India and UK" },
  ];

  return (
    <section className="relative w-full bg-[var(--hz-ink)] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="hz-eyebrow text-[var(--hz-aqua)]">Enterprise ready</span>
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
              className={`p-7 sm:p-8 ${i % 2 === 0 ? "sm:border-r sm:border-white/[0.12]" : ""} ${
                i < 2 ? "sm:border-b sm:border-white/[0.12]" : ""
              } lg:border-b-0 lg:border-r lg:border-white/[0.12] lg:last:border-r-0`}
            >
              <p className="hz-display hz-tnum text-[clamp(2.2rem,5vw,3.1rem)] leading-none text-white">
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

        {/* The accreditations, in the same frame language. Knocked out to white
            so four differently-coloured vendor badges read as one row on a dark
            ground. This is the one place that treatment is right: here they are
            a credential LIST, not the credential itself. */}
        <div className="mt-4 rounded-2xl border border-white/[0.12] px-7 py-8 sm:px-10">
          <p className="text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">
            Certified minority and women owned
          </p>
          <ul className="mt-7 grid grid-cols-2 items-center gap-x-10 gap-y-8 sm:grid-cols-4 sm:gap-x-14">
            {CERTS.map((c) => (
              <li key={c.name} className="flex items-center justify-center">
                <Image
                  src={c.logo}
                  alt={`${c.name} certification`}
                  width={c.w}
                  height={c.h}
                  className={`${c.cls} w-auto object-contain opacity-75 brightness-0 invert transition-opacity duration-300 hover:opacity-100`}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
