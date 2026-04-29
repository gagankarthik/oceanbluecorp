"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Cloud, Brain, Users, Shield, TrendingUp,
  Briefcase, Code, Database, Sparkles, ArrowUpRight, ArrowRight,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const services = [
  {
    id: "01",
    title: "Cloud Infrastructure",
    description: "Scale seamlessly across AWS, Azure, and GCP with enterprise-grade architecture and 99.99% uptime SLA.",
    icon: Cloud,
    iconColor: "#3b82f6",
    iconBg: "#eff6ff",
  },
  {
    id: "02",
    title: "AI & Machine Learning",
    description: "Transform data into intelligence with predictive analytics, NLP, and computer vision built for production.",
    icon: Brain,
    iconColor: "#8b5cf6",
    iconBg: "#f5f3ff",
  },
  {
    id: "03",
    title: "IT Talent Solutions",
    description: "Build exceptional teams with pre-vetted specialists who are ready to ship from day one.",
    icon: Users,
    iconColor: "#10b981",
    iconBg: "#ecfdf5",
  },
  {
    id: "04",
    title: "Enterprise Systems",
    description: "Modernize legacy platforms with SAP, Oracle, and cloud-native migrations — zero disruption.",
    icon: Briefcase,
    iconColor: "#f59e0b",
    iconBg: "#fffbeb",
  },
  {
    id: "05",
    title: "Managed Services",
    description: "24/7 proactive monitoring, incident response, and optimization so your team can focus on growth.",
    icon: Shield,
    iconColor: "#ef4444",
    iconBg: "#fef2f2",
  },
  {
    id: "06",
    title: "Growth Strategy",
    description: "Strategic consulting that aligns technology investments with measurable business outcomes.",
    icon: TrendingUp,
    iconColor: "#22c55e",
    iconBg: "#f0fdf4",
  },
  {
    id: "07",
    title: "DevOps Excellence",
    description: "Automated CI/CD pipelines, container orchestration, and infrastructure-as-code at enterprise scale.",
    icon: Code,
    iconColor: "#64748b",
    iconBg: "#f8fafc",
  },
  {
    id: "08",
    title: "Data Analytics",
    description: "Real-time analytics, data warehousing, and BI dashboards — turning raw data into clear decisions.",
    icon: Database,
    iconColor: "#6366f1",
    iconBg: "#eef2ff",
  },
  {
    id: "09",
    title: "Digital Transformation",
    description: "End-to-end transformation strategies that future-proof your operations and accelerate velocity.",
    icon: Sparkles,
    iconColor: "#eab308",
    iconBg: "#fefce8",
  },
];

// ─── Animation variants ───────────────────────────────────────────────────────

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045 } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

// ─── Service card ─────────────────────────────────────────────────────────────

function ServiceCard({ service }: { service: typeof services[0] }) {
  return (
    <Link
      href="/services"
      className="group relative flex flex-col bg-white p-7 lg:p-8 min-h-[220px] hover:bg-[#8d81f0]/[0.025] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8d81f0]"
    >
      {/* Top row: icon + id */}
      <div className="flex items-start justify-between mb-6">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 flex-shrink-0"
          style={{ backgroundColor: service.iconBg }}
        >
          <service.icon className="w-5 h-5" style={{ color: service.iconColor }} />
        </div>
        <span className="font-mono text-[11px] text-gray-300 tabular-nums select-none">
          {service.id}
        </span>
      </div>

      {/* Text */}
      <h3 className="text-gray-900 text-[15px] font-semibold tracking-tight mb-2 leading-snug">
        {service.title}
      </h3>
      <p className="text-gray-500 text-sm leading-relaxed flex-1">
        {service.description}
      </p>

      {/* Reveal arrow — appears on hover */}
      <div className="mt-5 flex items-center gap-1.5 text-[#8d81f0] text-sm font-medium opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
        <span>Learn more</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </Link>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function TerminalServices() {
  return (
    <section className="bg-white py-20 md:py-28 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* ── Section header (left-aligned — Law of Proximity) ── */}
        <div className="max-w-2xl mb-14 md:mb-18 lg:mb-20">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#8d81f0]" />
            <span className="text-[11px] font-mono text-[#8d81f0] tracking-[0.15em] uppercase">
              What we offer
            </span>
          </div>

          {/* Headline — Peak-End Rule: make this memorable */}
          <h2 className="text-4xl md:text-[2.75rem] lg:text-5xl font-bold text-gray-900 tracking-tight leading-[1.08] mb-5">
            Everything your enterprise
            <br />
            <span className="text-[#8d81f0]">needs to move faster.</span>
          </h2>

          <p className="text-gray-500 text-lg leading-relaxed">
            From cloud infrastructure to elite talent — end-to-end solutions
            that drive measurable business outcomes.
          </p>
        </div>

        {/* ── Service grid — gap-px creates thin dividing lines ── */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
        >
          {services.map(service => (
            <motion.div key={service.id} variants={cardVariants}>
              <ServiceCard service={service} />
            </motion.div>
          ))}
        </motion.div>

        {/* ── Bottom bar — single CTA (Hick's Law) ── */}
        <div className="mt-10 md:mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <p className="text-gray-400 text-sm">
            Trusted by 200+ enterprises across North America and beyond.
          </p>
          <Link
            href="/services"
            className="group inline-flex items-center gap-2.5 bg-gray-900 hover:bg-[#8d81f0] text-white px-7 py-3.5 rounded-full text-sm font-semibold transition-colors duration-200 whitespace-nowrap flex-shrink-0"
          >
            View all services
            <ArrowUpRight className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
          </Link>
        </div>
      </div>
    </section>
  );
}
