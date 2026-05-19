"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Award,
  Building2,
  ShieldCheck,
  Layers,
  type LucideIcon,
} from "lucide-react";

/* ============================================================
   STATS — "Our Impact"
   Light, brand-coloured cards on a warm gradient panel.
   Each stat has its own colour identity + animated counter.
   ============================================================ */

type Stat = {
  id: number;
  value: number;
  suffix: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  tint: {
    bg: string;
    iconBg: string;
    iconText: string;
    border: string;
    accent: string;
  };
};

const stats: Stat[] = [
  {
    id: 1,
    value: 10, suffix: "+",
    label: "Years of Excellence",
    desc: "Delivering enterprise IT since 2010.",
    icon: Award,
    tint: {
      bg: "bg-blue-50/60",
      iconBg: "bg-blue-100",
      iconText: "text-blue-700",
      border: "border-blue-100",
      accent: "from-blue-600 to-cyan-500",
    },
  },
  {
    id: 2,
    value: 50, suffix: "+",
    label: "Enterprise Clients",
    desc: "Trusted across North America.",
    icon: Building2,
    tint: {
      bg: "bg-violet-50/60",
      iconBg: "bg-violet-100",
      iconText: "text-violet-700",
      border: "border-violet-100",
      accent: "from-violet-600 to-purple-500",
    },
  },
  {
    id: 3,
    value: 98, suffix: "%",
    label: "Client Retention",
    desc: "Year-over-year renewal rate.",
    icon: ShieldCheck,
    tint: {
      bg: "bg-emerald-50/60",
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-700",
      border: "border-emerald-100",
      accent: "from-emerald-600 to-teal-500",
    },
  },
  {
    id: 4,
    value: 8, suffix: "+",
    label: "Software Solutions",
    desc: "Purpose-built platforms deployed.",
    icon: Layers,
    tint: {
      bg: "bg-amber-50/60",
      iconBg: "bg-amber-100",
      iconText: "text-amber-700",
      border: "border-amber-100",
      accent: "from-amber-600 to-orange-500",
    },
  },
];

function Counter({
  target, suffix, trigger, gradient,
}: {
  target: number;
  suffix: string;
  trigger: boolean;
  gradient: string;
}) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    const duration = 1600;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setCount(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [trigger, target]);

  return (
    <div className="flex items-end leading-none tabular-nums">
      <span
        className={`bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(3rem, 6vw, 5rem)",
          fontWeight: 700,
          letterSpacing: "-0.04em",
        }}
      >
        {count}
      </span>
      <span
        className={`mb-1.5 ml-0.5 bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
          fontWeight: 700,
        }}
      >
        {suffix}
      </span>
    </div>
  );
}

function StatCard({ s, i, trigger }: { s: Stat; i: number; trigger: boolean }) {
  const Icon = s.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={trigger ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.08 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-2xl border ${s.tint.border} ${s.tint.bg} p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-6`}
    >
      {/* Soft accent glow on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-60"
        style={{ background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }}
      />

      <div className="relative flex items-start justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${s.tint.iconBg} ${s.tint.iconText}`}>
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-400 tabular-nums">
          0{s.id}
        </span>
      </div>

      <div className="relative mt-6">
        <Counter target={s.value} suffix={s.suffix} trigger={trigger} gradient={s.tint.accent} />
      </div>

      <p
        className="relative mt-2 text-[15px] font-semibold text-slate-900"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {s.label}
      </p>
      <p className="relative mt-1 text-[13px] leading-relaxed text-slate-500">{s.desc}</p>
    </motion.div>
  );
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px -10% 0px" });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-20 sm:py-28"
      style={{
        background:
          "linear-gradient(180deg, #ffffff 0%, #f8fafc 35%, #eef2ff 100%)",
      }}
    >
      {/* Soft brand washes */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-violet-100/40 blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold"
              style={{
                background:
                  "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(37,99,235,0.08))",
                border: "1px solid rgba(16,185,129,0.22)",
                color: "#047857",
                fontFamily: "var(--font-display)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Our Impact
            </div>
            <h2
              className="text-[1.85rem] font-extrabold leading-[1.06] tracking-tight text-slate-900 sm:text-[2.4rem] md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              A track record of{" "}
              <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">
                excellence.
              </span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-slate-500 md:text-right">
            We deliver measurable results that help organisations scale faster
            with proven expertise across every industry we serve.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {stats.map((s, i) => (
            <StatCard key={s.id} s={s} i={i} trigger={inView} />
          ))}
        </div>

        {/* Footer row */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-slate-200/60 pt-7 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-500">Consistent results since 2010.</p>
          <Link
            href="/about"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ fontFamily: "var(--font-display)" }}
          >
            About Ocean Blue
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
