"use client";

import { motion } from "framer-motion";
import {
  HeartPulse, Landmark, Zap, ShoppingBag, Truck,
  Factory, Building2, Radio, type LucideIcon,
} from "lucide-react";
import { SectionHeader } from "./landing/SectionHeader";

type Industry = {
  name: string;
  blurb: string;
  icon: LucideIcon;
  tint: string;          // bg
  iconText: string;      // text
};

const industries: Industry[] = [
  { name: "Healthcare",     blurb: "HIPAA-compliant ML, EHR-integrated workflows.",            icon: HeartPulse, tint: "bg-[#fef3f2]", iconText: "text-[#b42318]" },
  { name: "Banking · Fintech", blurb: "PCI-DSS L1 platform engineering, real-time risk.",       icon: Landmark,   tint: "bg-[#ecf2ff]", iconText: "text-[#1a3eb8]" },
  { name: "Energy · Utilities", blurb: "SCADA modernisation, grid data lakes, IoT.",            icon: Zap,        tint: "bg-[#fffaeb]", iconText: "text-[#b54708]" },
  { name: "Retail · CPG",   blurb: "Demand forecasting, omnichannel orchestration.",            icon: ShoppingBag,tint: "bg-[#ecfdf3]", iconText: "text-[#067647]" },
  { name: "Logistics",      blurb: "Route optimisation, last-mile telemetry, TMS migrations.",  icon: Truck,      tint: "bg-[#f0f9ff]", iconText: "text-[#175cd3]" },
  { name: "Manufacturing",  blurb: "MES integration, predictive maintenance, OT/IT bridge.",    icon: Factory,    tint: "bg-[#f4f3ff]", iconText: "text-[#5925dc]" },
  { name: "Public Sector",  blurb: "FedRAMP-aligned cloud, citizen-service modernisation.",     icon: Building2,  tint: "bg-[#fdf2fa]", iconText: "text-[#c11574]" },
  { name: "Telecoms",       blurb: "5G OSS/BSS modernisation, network analytics.",              icon: Radio,      tint: "bg-[#f3f4f6]", iconText: "text-[#344054]" },
];

export default function Industries() {
  return (
    <section className="bg-[var(--reg-canvas)] px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Industries we know cold"
          title={<>Domain depth in the categories <span className="text-[var(--reg-text-tertiary)]">that move first.</span></>}
          subtitle="We bring engineers, architects, and operators who have shipped in your industry — not consultants who Googled it the night before kickoff."
        />

        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {industries.map((it, i) => {
            const Icon = it.icon;
            return (
              <motion.div
                key={it.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.45, delay: (i % 4) * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="group rounded-2xl border border-[var(--reg-line)] bg-[var(--reg-surface)] p-5 shadow-[var(--reg-shadow-xs)] transition-all hover:border-[var(--reg-line-2)] hover:shadow-[var(--reg-shadow-md)]"
              >
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${it.tint} ${it.iconText}`}>
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="text-[15px] font-semibold tracking-tight text-[var(--reg-text-primary)]">
                  {it.name}
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--reg-text-secondary)]">
                  {it.blurb}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
