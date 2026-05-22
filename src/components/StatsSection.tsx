"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useInView } from "framer-motion";
import {
  Activity, Map as MapIcon, MessageCircle,
  Award, Building2, ShieldCheck, Layers, ArrowRight,
  type LucideIcon,
} from "lucide-react";
import DottedMap from "dotted-map";
import { Area, AreaChart, CartesianGrid } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

/* ============================================================
   STATS — "Our Impact" bento. Previous impact numbers kept as a
   counter strip; map · support · uptime · activity chart around it.
   ============================================================ */

type Stat = {
  id: number;
  value: number;
  suffix: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  accent: string;
  iconBg: string;
  iconText: string;
};

const stats: Stat[] = [
  { id: 1, value: 10, suffix: "+", label: "Years of Excellence", desc: "Delivering enterprise IT since 2010.", icon: Award,       accent: "from-blue-600 to-cyan-500",    iconBg: "bg-blue-100",    iconText: "text-blue-700" },
  { id: 2, value: 50, suffix: "+", label: "Enterprise Clients",  desc: "Trusted across North America.",     icon: Building2,   accent: "from-violet-600 to-purple-500", iconBg: "bg-violet-100",  iconText: "text-violet-700" },
  { id: 3, value: 98, suffix: "%", label: "Client Retention",    desc: "Year-over-year renewal rate.",      icon: ShieldCheck, accent: "from-emerald-600 to-teal-500",  iconBg: "bg-emerald-100", iconText: "text-emerald-700" },
  { id: 4, value: 8,  suffix: "+", label: "Software Solutions",  desc: "Purpose-built platforms deployed.", icon: Layers,      accent: "from-amber-600 to-orange-500",  iconBg: "bg-amber-100",   iconText: "text-amber-700" },
];

function Counter({ target, suffix, trigger, gradient }: { target: number; suffix: string; trigger: boolean; gradient: string }) {
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
        style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.03em" }}
      >
        {count}
      </span>
      <span
        className={`mb-1 ml-0.5 bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}
        style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 700 }}
      >
        {suffix}
      </span>
    </div>
  );
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px -10% 0px" });

  return (
    <section className="bg-gradient-to-b from-white to-slate-50 px-4 py-20 sm:py-28">
      {/* Header */}
      <div className="mx-auto mb-12 max-w-5xl text-center">
        <h2
          className="text-[1.85rem] font-extrabold tracking-tight text-slate-900 sm:text-[2.4rem] md:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          A track record of{" "}
          <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">
            excellence.
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500">
          We deliver measurable results that help organisations scale faster with
          proven expertise across every industry we serve.
        </p>
      </div>

      {/* Bento grid */}
      <div className="mx-auto grid max-w-5xl border border-border md:grid-cols-2">
        {/* Previous impact numbers — 4-up counter strip */}
        <div ref={ref} className="col-span-full grid grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className={`border-border p-6 sm:p-8 ${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t" : ""} lg:border-t-0 ${i !== 0 ? "lg:border-l" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${s.iconBg} ${s.iconText}`}>
                    <Icon className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                </div>
                <div className="mt-4">
                  <Counter target={s.value} suffix={s.suffix} trigger={inView} gradient={s.accent} />
                </div>
                <p className="mt-1 text-[14px] font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                  {s.label}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Delivery footprint + map */}
        <div className="border-t border-border">
          <div className="p-6 sm:p-12">
            <span className="text-muted-foreground flex items-center gap-2">
              <MapIcon className="size-4" />
              Nationwide delivery
            </span>
            <p className="mt-8 text-2xl font-semibold text-slate-900">
              Delivery teams and enterprise clients across North America.
            </p>
          </div>

          <div aria-hidden className="relative">
            <div className="absolute inset-0 z-10 m-auto size-fit">
              <div className="relative z-[1] flex w-fit items-center gap-2 rounded-[var(--radius)] border border-border bg-white px-3 py-1 text-xs font-medium shadow-md shadow-black/5">
                <span className="text-lg">🇺🇸</span> Headquartered in Powell, Ohio
              </div>
              <div className="absolute inset-2 -bottom-2 mx-auto rounded-[var(--radius)] border border-border bg-white px-3 py-4 text-xs font-medium shadow-md shadow-black/5" />
            </div>

            <div className="relative overflow-hidden">
              <div
                className="absolute inset-0 z-[1]"
                style={{ backgroundImage: "radial-gradient(circle at 50% 50%, transparent 35%, #ffffff 78%)" }}
              />
              <Map />
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="overflow-hidden border-t border-border bg-zinc-50 p-6 sm:p-12 md:border-l">
          <div className="relative z-10">
            <span className="text-muted-foreground flex items-center gap-2">
              <MessageCircle className="size-4" />
              Email and web support
            </span>
            <p className="my-8 text-2xl font-semibold text-slate-900">
              Reach our team by email or web — replies within 24 hours.
            </p>
          </div>
          <div aria-hidden className="flex flex-col gap-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full border border-border">
                  <span className="size-3 rounded-full bg-primary" />
                </span>
                <span className="text-muted-foreground text-xs">User</span>
              </div>
              <div className="mt-1.5 w-3/5 rounded-[var(--radius)] border border-border bg-white p-3 text-xs">
                Hey, can you get a job with Web development?
              </div>
            </div>

            <div>
              <div className="mb-1 ml-auto w-3/5 rounded-[var(--radius)] bg-blue-600 p-3 text-xs text-white">
                Absolutely — let&apos;s set up a discovery call today and map the
                plan together.
              </div>
              <span className="text-muted-foreground block text-right text-xs">Oceanblue Team</span>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}

const map = new DottedMap({ height: 55, grid: "diagonal" });
const points = map.getPoints();

const svgOptions = {
  backgroundColor: "var(--background)",
  color: "currentColor",
  radius: 0.15,
};

const Map = () => {
  const viewBox = `0 0 120 60`;
  return (
    <svg viewBox={viewBox} style={{ background: svgOptions.backgroundColor }} className="text-slate-400">
      {points.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={svgOptions.radius} fill={svgOptions.color} />
      ))}
    </svg>
  );
};

const chartConfig = {
  projects: { label: "Projects", color: "#2563eb" },
  requests: { label: "Requests", color: "#60a5fa" },
} satisfies ChartConfig;

const chartData = [
  { month: "May", projects: 56, requests: 224 },
  { month: "June", projects: 56, requests: 224 },
  { month: "January", projects: 126, requests: 252 },
  { month: "February", projects: 205, requests: 410 },
  { month: "March", projects: 200, requests: 126 },
  { month: "April", projects: 400, requests: 800 },
];

const MonitoringChart = () => {
  return (
    <ChartContainer className="h-80 aspect-auto md:h-96" config={chartConfig}>
      <AreaChart accessibilityLayer data={chartData} margin={{ left: 0, right: 0 }}>
        <defs>
          <linearGradient id="fillProjects" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-projects)" stopOpacity={0.8} />
            <stop offset="55%" stopColor="var(--color-projects)" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="fillRequests" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-requests)" stopOpacity={0.8} />
            <stop offset="55%" stopColor="var(--color-requests)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <ChartTooltip active cursor={false} content={<ChartTooltipContent />} />
        <Area strokeWidth={2} dataKey="requests" type="stepBefore" fill="url(#fillRequests)" fillOpacity={0.1} stroke="var(--color-requests)" stackId="a" />
        <Area strokeWidth={2} dataKey="projects" type="stepBefore" fill="url(#fillProjects)" fillOpacity={0.1} stroke="var(--color-projects)" stackId="a" />
      </AreaChart>
    </ChartContainer>
  );
};
