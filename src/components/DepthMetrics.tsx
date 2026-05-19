"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Calendar, Building2, ShieldCheck, Gauge, type LucideIcon } from "lucide-react";
import { SectionHeader } from "./landing/SectionHeader";

/* ============================================================
   OUTCOMES — Dark metrics panel with sparklines.
   Register/Mercury style: restrained, single accent.
   ============================================================ */

type Metric = {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  delta?: string;
  caption: string;
  icon: LucideIcon;
  series: number[];
};

const metrics: Metric[] = [
  {
    label: "Years on station",
    value: 16, suffix: "+",
    delta: "+1 yr",
    caption: "Delivering enterprise IT since 2010 — across three platform eras and counting.",
    icon: Calendar,
    series: [3, 5, 6, 7, 9, 10, 12, 13, 14, 15, 16],
  },
  {
    label: "Enterprise clients",
    value: 50, suffix: "+",
    delta: "+8 YoY",
    caption: "Fortune 500 leaders and category-defining mid-market operators across North America.",
    icon: Building2,
    series: [12, 17, 22, 27, 30, 34, 38, 42, 45, 48, 50],
  },
  {
    label: "Annual retention",
    value: 98, suffix: "%",
    delta: "vs 87% industry",
    caption: "Year-over-year renewal rate — what enterprise buyers quote when asked why they stay.",
    icon: ShieldCheck,
    series: [92, 93, 94, 95, 95, 96, 96, 97, 97, 98, 98],
  },
  {
    label: "Operations uptime",
    value: 99.99, decimals: 2, suffix: "%",
    delta: "365 nights",
    caption: "Measured across managed-service workloads, 24 hours a day, every day.",
    icon: Gauge,
    series: [99.92, 99.94, 99.95, 99.96, 99.97, 99.97, 99.98, 99.98, 99.99, 99.99, 99.99],
  },
];

function useCountUp(target: number, decimals = 0, trigger = false, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [trigger, target, duration]);
  return value.toFixed(decimals);
}

function Sparkline({ data, trigger }: { data: number[]; trigger: boolean }) {
  const w = 200, h = 48, pad = 4;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `${linePath} L ${pad + (w - pad * 2)},${h - pad} L ${pad},${h - pad} Z`;
  const last = points[points.length - 1].split(",");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full" aria-hidden>
      <defs>
        <linearGradient id="metric-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#a4bcfd" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a4bcfd" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill="url(#metric-area)"
        initial={{ opacity: 0 }}
        animate={trigger ? { opacity: 1 } : {}}
        transition={{ duration: 0.9, delay: 0.6 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="#a4bcfd"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={trigger ? { pathLength: 1 } : {}}
        transition={{ duration: 1.4, delay: 0.3, ease: "easeOut" }}
      />
      <motion.circle
        cx={last[0]} cy={last[1]} r="3"
        fill="#fff" stroke="#444ce7" strokeWidth="2"
        initial={{ opacity: 0, scale: 0 }}
        animate={trigger ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.35, delay: 1.6 }}
      />
    </svg>
  );
}

function MetricCard({ m, i, trigger }: { m: Metric; i: number; trigger: boolean }) {
  const Icon = m.icon;
  const display = useCountUp(m.value, m.decimals ?? 0, trigger);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={trigger ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: 0.08 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl border border-[var(--reg-ink-3)] bg-[var(--reg-ink-2)] p-5"
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/5 ring-1 ring-white/10">
            <Icon className="h-3.5 w-3.5 text-[#a4bcfd]" strokeWidth={2.25} />
          </span>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/55">
            {m.label}
          </span>
        </div>
        {m.delta && (
          <span className="reg-tnum rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-400/30">
            {m.delta}
          </span>
        )}
      </div>

      {/* Number */}
      <div className="flex items-end gap-1">
        <span
          className="reg-tnum text-white"
          style={{
            fontFamily: "var(--font-geist-sans), var(--font-inter), system-ui, sans-serif",
            fontSize: "clamp(2.4rem, 4vw, 3.4rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.035em",
            fontWeight: 600,
          }}
        >
          {display}
        </span>
        {m.suffix && (
          <span className="pb-1 text-[22px] font-semibold text-[#a4bcfd]">{m.suffix}</span>
        )}
      </div>

      {/* Sparkline */}
      <div className="mt-3">
        <Sparkline data={m.series} trigger={trigger} />
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed text-white/65">{m.caption}</p>
    </motion.div>
  );
}

export default function DepthMetrics() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px -10% 0px" });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28"
      style={{ background: "var(--reg-ink)" }}
    >
      {/* Subtle brand glow */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 h-72 opacity-50"
        style={{
          background:
            "radial-gradient(60% 60% at 30% 0%, rgba(68,76,231,0.22) 0%, transparent 70%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 -bottom-24 h-72 opacity-40"
        style={{
          background:
            "radial-gradient(60% 60% at 70% 100%, rgba(56,89,235,0.25) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Light-on-dark version of SectionHeader, inlined for control */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.13em] text-[#a4bcfd]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#a4bcfd]" />
            Outcomes
          </div>
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-tight text-white sm:text-[44px] lg:text-[52px]">
            Measured outcomes,
            <br />
            <span className="text-white/55">not marketing math.</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/65 sm:text-[16px]">
            Every figure verified against client records and reported in
            quarterly business reviews — never inflated by averages or
            aspirational footnotes.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {metrics.map((m, i) => (
            <MetricCard key={m.label} m={m} i={i} trigger={inView} />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-y-3 border-t border-white/10 pt-6">
          <p className="text-[12.5px] text-white/55">
            Drawn from 16 years on station — audited every quarter.
          </p>
          <span className="inline-flex items-center gap-2 text-[12.5px] text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 reg-live" />
            Updated Q2 · 2026
          </span>
        </div>
      </div>
    </section>
  );
}
