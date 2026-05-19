"use client";

import { motion } from "framer-motion";
import {
  Users, Briefcase, Clock, Shield, Globe2, TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SectionHeader } from "./landing/SectionHeader";

/* ============================================================
   DIFFERENTIATION — Consulting & Staffing specifics.
   Bento grid: one large dark "Talent Network" feature + four
   supporting cards. No AI gimmicks — only what we do.
   ============================================================ */

export default function Differentiation() {
  return (
    <section className="bg-[var(--reg-canvas)] px-4 py-20 sm:px-6 sm:py-28" id="how-we-help">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="How we help"
          title={<>One firm. Two engagement models. <span className="text-[var(--reg-text-tertiary)]">Same accountable team.</span></>}
          subtitle="Ocean Blue brings staff augmentation and project-based consulting under one roof — so you stop stitching together a roster of vendors with conflicting SOWs and overlapping invoices."
        />

        <div className="mt-12 grid grid-cols-12 gap-3 sm:gap-4">
          {/* Large dark feature: Talent Network */}
          <BentoCard
            className="col-span-12 min-h-[360px] lg:col-span-8"
            tone="dark"
            badge={{ label: "Talent Network", icon: Users, tone: "lime" }}
            title="A bench of engineers our clients trust."
            body="1,200+ pre-vetted technologists — cloud, data, platform, ERP, application, security. Hand-screened by senior practitioners (not algorithms), placed in days, and backed by our retention guarantee."
          >
            <TalentNetworkMock />
          </BentoCard>

          {/* Project Consulting — brand-tone */}
          <BentoCard
            className="col-span-12 sm:col-span-6 lg:col-span-4"
            tone="brand"
            badge={{ label: "Project Consulting", icon: Briefcase, tone: "light" }}
            title="SOW work, shipped on time."
            body="Fixed-scope engagements — discovery, build, cutover. One named delivery lead, weekly burn-down, no scope creep without your signature."
          >
            <ProjectMock />
          </BentoCard>

          {/* Time-to-bill */}
          <BentoCard
            className="col-span-12 sm:col-span-6 lg:col-span-4"
            tone="surface"
            badge={{ label: "Speed", icon: Clock, tone: "brand" }}
            title="Median 9 days to first invoice."
            body="From request to onboarded engineer — measured across the last 200 contract placements."
          >
            <SpeedMock />
          </BentoCard>

          {/* Coverage */}
          <BentoCard
            className="col-span-12 sm:col-span-6 lg:col-span-4"
            tone="surface"
            badge={{ label: "Coverage", icon: Globe2, tone: "teal" }}
            title="14 delivery markets across North America."
            body="On-site, hybrid, fully-remote — staffed locally where you need bodies in the room, distributed where you don't."
          >
            <CoverageMock />
          </BentoCard>

          {/* Compliance / trust */}
          <BentoCard
            className="col-span-12 sm:col-span-6 lg:col-span-4"
            tone="surface"
            badge={{ label: "Compliance", icon: Shield, tone: "violet" }}
            title="Vetted, insured, audit-ready."
            body="E-Verify, full background, BAA-ready, MBE/MSDP certified. SOC 2-aligned operations on every engagement we run."
          >
            <ComplianceMock />
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- BentoCard ----------------------------- */

const toneStyles = {
  dark:    "bg-[var(--reg-ink)] text-white border-[var(--reg-ink-3)]",
  brand:   "bg-gradient-to-br from-[var(--reg-brand-600)] to-[var(--reg-brand-700)] text-white border-[var(--reg-brand-700)]",
  surface: "bg-[var(--reg-surface)] text-[var(--reg-text-primary)] border-[var(--reg-line)]",
};

const badgeTones = {
  lime:   "bg-[#d4ff3f] text-[var(--reg-ink)]",
  light:  "bg-white/15 text-white border border-white/15",
  brand:  "bg-[var(--reg-brand-50)] text-[var(--reg-brand-700)] border border-[var(--reg-brand-200)]",
  teal:   "bg-[#ecfdf3] text-[#067647] border border-[#abefc6]",
  violet: "bg-[#f4f3ff] text-[#5925dc] border border-[#d9d6fe]",
};

function BentoCard({
  className,
  tone,
  badge,
  title,
  body,
  children,
}: {
  className?: string;
  tone: keyof typeof toneStyles;
  badge: { label: string; icon: LucideIcon; tone: keyof typeof badgeTones };
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  const BadgeIcon = badge.icon;
  const bodyTone =
    tone === "dark"
      ? "text-white/70"
      : tone === "brand"
      ? "text-white/85"
      : "text-[var(--reg-text-secondary)]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex flex-col overflow-hidden rounded-2xl border p-5 sm:p-6 ${toneStyles[tone]} ${className ?? ""}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${badgeTones[badge.tone]}`}>
          <BadgeIcon className="h-3 w-3" strokeWidth={2.5} />
          {badge.label}
        </span>
      </div>
      <h3 className={`text-[22px] font-semibold leading-tight tracking-tight sm:text-[26px] ${tone !== "surface" ? "" : "text-[var(--reg-text-primary)]"}`}>
        {title}
      </h3>
      <p className={`mt-2 text-[13.5px] leading-relaxed ${bodyTone}`}>{body}</p>
      {children && <div className="mt-auto pt-5">{children}</div>}
    </motion.div>
  );
}

/* ----------------------------- Mocks ----------------------------- */

/* Talent Network — rotating "available now" engineers */
function TalentNetworkMock() {
  const candidates = [
    { initials: "PM", name: "Priya M.",  role: "Sr. Cloud Architect · AWS / GCP",  loc: "Austin · remote",   match: 96 },
    { initials: "DO", name: "Daniel O.", role: "Staff ML Engineer · Python / GCP", loc: "Toronto · hybrid",  match: 92 },
    { initials: "AS", name: "Anika S.",  role: "Platform SRE · Kubernetes",         loc: "NYC · onsite",      match: 88 },
    { initials: "RM", name: "Rafael M.", role: "SAP S/4 Functional Lead",           loc: "Columbus · hybrid", match: 91 },
  ];
  const [highlight, setHighlight] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHighlight((v) => (v + 1) % candidates.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {candidates.map((c, i) => (
        <motion.div
          key={c.name}
          animate={
            i === highlight
              ? { borderColor: "rgba(255,255,255,0.4)", scale: [1, 1.015, 1] }
              : { borderColor: "rgba(255,255,255,0.10)", scale: 1 }
          }
          transition={{ duration: 0.55 }}
          className="flex items-center gap-3 rounded-lg border bg-white/5 p-3"
        >
          <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[var(--reg-brand-600)] text-[11.5px] font-semibold text-white">
            {c.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white">{c.name}</p>
            <p className="truncate text-[11px] text-white/55">{c.role}</p>
            <p className="truncate text-[10.5px] text-white/40">{c.loc}</p>
          </div>
          <span className="reg-tnum inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
            {c.match}%
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* Project consulting — small kanban-style mini-board */
function ProjectMock() {
  const cols = [
    { label: "In flight", count: 6, items: ["Cutover wave 2", "UAT round 3"] },
    { label: "Shipping",  count: 2, items: ["Go-live · payroll"] },
    { label: "Done",      count: 12, items: [] },
  ];
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {cols.map((c) => (
        <div key={c.label} className="rounded-md bg-white/10 p-2 backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-white/70">
            <span>{c.label}</span>
            <span className="reg-tnum">{c.count}</span>
          </div>
          <div className="mt-1.5 space-y-1">
            {c.items.map((it) => (
              <div key={it} className="truncate rounded-sm bg-white/15 px-1.5 py-1 text-[10.5px] font-medium text-white">
                {it}
              </div>
            ))}
            {c.items.length === 0 && (
              <div className="rounded-sm bg-white/[0.06] px-1.5 py-1 text-[10.5px] text-white/40">
                —
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* Speed — pipeline stages */
function SpeedMock() {
  const stages = [
    { label: "Brief",        val: "Day 0" },
    { label: "Shortlist",    val: "Day 2" },
    { label: "Interviews",   val: "Day 5" },
    { label: "On project",   val: "Day 9" },
  ];
  return (
    <div className="space-y-1.5">
      {stages.map((s) => (
        <div
          key={s.label}
          className="flex items-center justify-between rounded-md border border-[var(--reg-line)] bg-[var(--reg-surface-2)] px-3 py-2 text-[12px]"
        >
          <span className="flex items-center gap-1.5 text-[var(--reg-text-secondary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--reg-brand-600)]" />
            {s.label}
          </span>
          <span className="reg-tnum font-mono font-semibold text-[var(--reg-text-primary)]">
            {s.val}
          </span>
        </div>
      ))}
    </div>
  );
}

/* Coverage — three live markets */
function CoverageMock() {
  return (
    <div className="space-y-1.5">
      {[
        { city: "Columbus, OH",   val: "HQ + delivery",    trend: "primary" },
        { city: "NYC + Boston",   val: "On-site bench",    trend: "active" },
        { city: "Toronto + YYC",  val: "Cross-border",     trend: "active" },
      ].map((l) => (
        <div
          key={l.city}
          className="flex items-center justify-between rounded-md border border-[var(--reg-line)] bg-[var(--reg-surface-2)] px-3 py-2 text-[12px]"
        >
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--reg-success-500)] reg-live" />
            <span className="font-semibold text-[var(--reg-text-primary)]">{l.city}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-[var(--reg-text-secondary)]">{l.val}</span>
            <span className="rounded-full bg-[var(--reg-success-50)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--reg-success-700)]">
              {l.trend}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* Compliance — credential badges */
function ComplianceMock() {
  const badges = ["E-Verify", "BAA-ready", "MBE / MSDP", "SOC 2 aligned", "GDPR", "PCI-DSS"];
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span
          key={b}
          className="inline-flex items-center gap-1 rounded-md border border-[var(--reg-line)] bg-[var(--reg-surface-2)] px-2 py-1 text-[11px] font-semibold text-[var(--reg-text-secondary)]"
        >
          <Shield className="h-2.5 w-2.5 text-[#5925dc]" strokeWidth={2.5} />
          {b}
        </span>
      ))}
    </div>
  );
}
