"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Cloud, Brain, Users, Shield, TrendingUp,
  Briefcase, Code, Database, Sparkles, ArrowUpRight,
} from "lucide-react";

const services = [
  { id: "01", title: "Cloud Infrastructure",   icon: Cloud,      iColor: "#2563eb", iBg: "#eff6ff", glow: "rgba(37,99,235,0.15)",   desc: "Scale across AWS, Azure, and GCP with enterprise-grade architecture and 99.99% uptime SLA." },
  { id: "02", title: "AI & Machine Learning",  icon: Brain,      iColor: "#7c3aed", iBg: "#f5f3ff", glow: "rgba(124,58,237,0.15)",  desc: "Predictive analytics, NLP, and computer vision built and deployed for production workloads." },
  { id: "03", title: "IT Talent Solutions",    icon: Users,      iColor: "#059669", iBg: "#ecfdf5", glow: "rgba(5,150,105,0.15)",   desc: "Pre-vetted specialists who integrate fast and ship from day one — contract or direct-hire." },
  { id: "04", title: "Enterprise Systems",     icon: Briefcase,  iColor: "#d97706", iBg: "#fffbeb", glow: "rgba(217,119,6,0.15)",   desc: "Modernize SAP, Oracle, and cloud-native migrations with zero operational disruption." },
  { id: "05", title: "Managed Services",       icon: Shield,     iColor: "#dc2626", iBg: "#fef2f2", glow: "rgba(220,38,38,0.15)",   desc: "24/7 proactive monitoring, incident response, and performance optimization." },
  { id: "06", title: "Growth Strategy",        icon: TrendingUp, iColor: "#16a34a", iBg: "#f0fdf4", glow: "rgba(22,163,74,0.15)",   desc: "Align technology investments with measurable outcomes through strategic advisory." },
  { id: "07", title: "DevOps Excellence",      icon: Code,       iColor: "#4f46e5", iBg: "#eef2ff", glow: "rgba(79,70,229,0.15)",   desc: "CI/CD pipelines, Kubernetes orchestration, and infrastructure-as-code at scale." },
  { id: "08", title: "Data Analytics",         icon: Database,   iColor: "#0284c7", iBg: "#f0f9ff", glow: "rgba(2,132,199,0.15)",   desc: "Real-time analytics, warehousing, and BI dashboards — raw data into clear decisions." },
  { id: "09", title: "Digital Transformation", icon: Sparkles,   iColor: "#b45309", iBg: "#fefce8", glow: "rgba(180,83,9,0.15)",    desc: "End-to-end transformation strategies that future-proof operations and accelerate velocity." },
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.055 } } };
const card    = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } } };

function ServiceCard({ s }: { s: typeof services[0] }) {
  return (
    <Link
      href="/services"
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-7 transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.04)",
        "--glow": s.glow,
      } as React.CSSProperties}
    >
      {/* Accent top bar on hover */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, ${s.iColor}, transparent)` }}
      />

      {/* Hover glow overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: `inset 0 0 0 1px ${s.iColor}22, 0 8px 32px -4px ${s.iColor}1a` }}
      />

      {/* Icon + number */}
      <div className="mb-5 flex items-start justify-between">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{ background: s.iBg }}
        >
          <s.icon className="h-5 w-5" style={{ color: s.iColor }} />
        </div>
        <span className="font-mono text-[10px] text-gray-200 tabular-nums">{s.id}</span>
      </div>

      <h3
        className="mb-2 text-[15px] font-bold tracking-tight text-gray-900"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {s.title}
      </h3>
      <p className="flex-1 text-sm leading-relaxed text-slate-500">{s.desc}</p>

      <div
        className="mt-5 flex translate-y-1 items-center gap-1 text-xs font-semibold opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
        style={{ color: s.iColor, fontFamily: "var(--font-display)" }}
      >
        Learn more <ArrowUpRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}

export default function TerminalServices() {
  return (
    <section className="bg-white py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* Header */}
        <div className="mb-14 flex flex-col gap-8 md:flex-row md:items-end md:justify-between lg:mb-20">
          <div className="max-w-2xl">
            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold"
              style={{
                background: "linear-gradient(135deg, rgba(37,99,235,0.07), rgba(124,58,237,0.07))",
                border: "1px solid rgba(124,58,237,0.18)",
                color: "#6d28d9",
                fontFamily: "var(--font-display)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              What We Offer
            </div>
            <h2
              className="text-[1.75rem] font-extrabold leading-[1.06] tracking-tight text-gray-900 sm:text-[2.4rem] md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Everything your enterprise
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">
                needs to move faster.
              </span>
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-slate-400 md:text-right">
            From cloud to talent — end-to-end solutions that drive measurable
            business outcomes across every vertical.
          </p>
        </div>

        {/* Service grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {services.map((s) => (
            <motion.div key={s.id} variants={card}>
              <ServiceCard s={s} />
            </motion.div>
          ))}
        </motion.div>

        {/* Footer row */}
        <div className="mt-12 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-400">Trusted by 200+ enterprises across North America and beyond.</p>
          <Link
            href="/services"
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md"
            style={{
              background: "linear-gradient(135deg, #1d4ed8, #4f46e5)",
              fontFamily: "var(--font-display)",
            }}
          >
            View all services
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
