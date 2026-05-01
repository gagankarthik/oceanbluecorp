"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const stats = [
  { id: 1, value: 10,  suffix: "+", label: "Years of Excellence",  desc: "Delivering enterprise IT since 2010", grad: "from-blue-400 to-cyan-400" },
  { id: 2, value: 50,  suffix: "+", label: "Enterprise Clients",   desc: "Across North America",               grad: "from-violet-400 to-purple-400" },
  { id: 3, value: 98,  suffix: "%", label: "Client Retention",     desc: "Year-over-year renewal rate",        grad: "from-emerald-400 to-cyan-400" },
  { id: 4, value: 8,   suffix: "+", label: "Software Solutions",   desc: "Purpose-built platforms deployed",   grad: "from-indigo-400 to-blue-400" },
];

function Counter({ value, suffix, grad }: { value: number; suffix: string; grad: string }) {
  const [count, setCount] = useState(0);
  const [fired, setFired] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fired) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      setFired(true);
      const dur = 1500, t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - t0) / dur, 1);
        setCount(Math.floor((1 - Math.pow(1 - p, 3)) * value));
        if (p < 1) requestAnimationFrame(tick);
        else setCount(value);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [value, fired]);

  return (
    <div ref={ref} className="flex items-end leading-none tabular-nums">
      <span
        className={`bg-gradient-to-br ${grad} bg-clip-text font-extrabold text-transparent`}
        style={{ fontFamily: "var(--font-display)", fontSize: "clamp(3.5rem, 6.5vw, 6rem)" }}
      >
        {count}
      </span>
      <span
        className={`mb-1 ml-0.5 bg-gradient-to-br ${grad} bg-clip-text font-extrabold text-transparent`}
        style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}
      >
        {suffix}
      </span>
    </div>
  );
}

export default function StatsSections() {
  return (
    <section
      className="relative w-full overflow-hidden py-20 md:py-28"
      style={{ background: "#080C14" }}
    >
      {/* Mesh gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 70% 60% at 0% 50%, rgba(37,99,235,0.12) 0%, transparent 55%)",
            "radial-gradient(ellipse 60% 50% at 100% 50%, rgba(124,58,237,0.1) 0%, transparent 55%)",
          ].join(", "),
        }}
      />

      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "32px 32px" }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">

        {/* Header */}
        <div className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold"
              style={{
                background: "rgba(52,211,153,0.08)",
                border: "1px solid rgba(52,211,153,0.2)",
                color: "#34d399",
                fontFamily: "var(--font-display)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Our Impact
            </div>
            <h2
              className="text-[1.7rem] font-extrabold leading-[1.06] tracking-tight text-white sm:text-[2.2rem] md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              A track record of{" "}
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                excellence.
              </span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-slate-400 md:text-right">
            We deliver measurable results that help businesses scale faster with
            proven expertise across every industry.
          </p>
        </div>

        {/* Stats grid */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "1rem" }}
        >
          {stats.map((s) => (
            <div
              key={s.id}
              className="group px-5 py-8 transition-colors duration-200 hover:bg-white/[0.02] sm:px-7 sm:py-10 md:px-10 md:py-12"
              style={{ background: "#080C14" }}
            >
              <Counter value={s.value} suffix={s.suffix} grad={s.grad} />
              <p
                className="mt-3 text-sm font-semibold text-white/75"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {s.label}
              </p>
              <p className="mt-0.5 text-xs text-white/28">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between border-t pt-7" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-sm text-white/20">Consistent results since 2010.</p>
          <Link
            href="/about"
            className="group inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
            style={{ fontFamily: "var(--font-display)" }}
          >
            About Ocean Blue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
