"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Cloud,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Hero side panel — "Operations Console" mock                       */
/*  Restrained Stripe/Mercury aesthetic. Single accent (brand-600).   */
/* ------------------------------------------------------------------ */

const services = [
  { name: "Cloud Platform",      load: 0.42, icon: Cloud },
  { name: "Managed SOC",         load: 0.28, icon: ShieldCheck },
  { name: "Data Pipelines",      load: 0.61, icon: Activity },
];

export function HeroIllustration() {
  return (
    <div className="relative w-full">
      {/* Floating mini-stat card top */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        className="absolute -top-4 -left-3 z-20 hidden rounded-xl border border-[var(--reg-line)] bg-[var(--reg-surface)] p-3 shadow-[var(--reg-shadow-md)] sm:block"
      >
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--reg-success-50)]">
            <CheckCircle2 className="h-4 w-4 text-[var(--reg-success-700)]" strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--reg-text-tertiary)]">
              Uptime · 30d
            </p>
            <p className="reg-tnum text-[15px] font-semibold leading-none text-[var(--reg-text-primary)]">
              99.99%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Floating mini-stat card bottom */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="absolute -bottom-4 -right-3 z-20 hidden rounded-xl border border-[var(--reg-line)] bg-[var(--reg-surface)] p-3 shadow-[var(--reg-shadow-md)] sm:block"
      >
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--reg-text-tertiary)]">
          Active engagements
        </p>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="reg-tnum text-[20px] font-semibold leading-none text-[var(--reg-text-primary)]">
            27
          </span>
          <span className="reg-tnum text-[11px] font-semibold text-[var(--reg-success-700)]">
            +3
          </span>
        </div>
      </motion.div>

      {/* Main console card */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--reg-line)] bg-[var(--reg-surface)] p-5 shadow-[var(--reg-shadow-lg)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--reg-line)] pb-3">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--reg-text-tertiary)]">
              Operations · live
            </p>
            <p className="mt-1 text-[15px] font-semibold leading-none text-[var(--reg-text-primary)]">
              ocean-blue / production
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--reg-success-200)] bg-[var(--reg-success-50)] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--reg-success-700)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--reg-success-500)] reg-live" />
            All normal
          </span>
        </div>

        {/* Service rows */}
        <ul className="mt-3.5 space-y-2">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.li
                key={s.name}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.55 + i * 0.06 }}
                className="grid grid-cols-12 items-center gap-3 rounded-lg border border-[var(--reg-line)] bg-[var(--reg-surface-2)] px-3 py-2.5"
              >
                <div className="col-span-6 flex items-center gap-2.5 min-w-0">
                  <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[var(--reg-surface)] ring-1 ring-[var(--reg-line)]">
                    <Icon className="h-3.5 w-3.5 text-[var(--reg-brand-700)]" strokeWidth={2.25} />
                  </span>
                  <span className="truncate text-[12.5px] font-semibold text-[var(--reg-text-primary)]">
                    {s.name}
                  </span>
                </div>
                <div className="col-span-4">
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--reg-surface-3)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.load * 100}%` }}
                      transition={{ duration: 1.1, delay: 0.85 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-y-0 left-0 rounded-full bg-[var(--reg-brand-600)]"
                    />
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <span className="reg-tnum text-[11.5px] font-semibold text-[var(--reg-text-secondary)]">
                    {Math.round(s.load * 100)}%
                  </span>
                </div>
              </motion.li>
            );
          })}
        </ul>

        {/* Mini sparkline */}
        <div className="mt-4 overflow-hidden rounded-lg border border-[var(--reg-line)] bg-[var(--reg-surface-2)] p-3">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--reg-text-tertiary)]">
                Throughput · last 60 min
              </p>
              <p className="reg-tnum mt-1 text-[18px] font-semibold leading-none text-[var(--reg-text-primary)]">
                12,840 <span className="text-[11px] font-medium text-[var(--reg-text-subtle)]">req/s</span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--reg-success-700)]">
              <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
              +12.4%
            </span>
          </div>

          <svg viewBox="0 0 320 64" className="mt-2 h-14 w-full" aria-hidden>
            <defs>
              <linearGradient id="heroSpark" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#1e4dd8" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#1e4dd8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.3 }}
              d="M0,50 L20,42 L40,46 L60,30 L80,38 L100,22 L120,28 L140,18 L160,26 L180,14 L200,20 L220,10 L240,18 L260,8 L280,16 L300,6 L320,12 L320,64 L0,64 Z"
              fill="url(#heroSpark)"
            />
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4, delay: 0.9, ease: "easeOut" }}
              d="M0,50 L20,42 L40,46 L60,30 L80,38 L100,22 L120,28 L140,18 L160,26 L180,14 L200,20 L220,10 L240,18 L260,8 L280,16 L300,6 L320,12"
              fill="none"
              stroke="#1e4dd8"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {[40, 100, 160, 220, 280].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2="64" stroke="#eaecf0" />
            ))}
          </svg>

          {/* KPI row */}
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--reg-line)] pt-3">
            {[
              { k: "P99 latency", v: "84 ms" },
              { k: "Open tickets", v: "2" },
              { k: "Coverage", v: "24 / 7" },
            ].map((kpi) => (
              <div key={kpi.k}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--reg-text-tertiary)]">
                  {kpi.k}
                </p>
                <p className="reg-tnum mt-0.5 text-[13px] font-semibold text-[var(--reg-text-primary)]">
                  {kpi.v}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
