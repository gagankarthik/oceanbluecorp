"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  UserPlus, Briefcase, ClipboardCheck, Wrench,
  ArrowRight, Check, type LucideIcon,
} from "lucide-react";
import { SectionHeader } from "./landing/SectionHeader";

/* ============================================================
   CAPABILITIES — Four practices, all consulting & staffing.
   Each row has a distinct, role-true mini mock.
   ============================================================ */

export default function CapabilitiesIndex() {
  return (
    <section className="bg-[var(--reg-surface)] px-4 py-20 sm:px-6 sm:py-28" id="capabilities">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="What we do"
          title={<>Four practices, one accountable team. <span className="text-[var(--reg-text-tertiary)]">No vendor stitching.</span></>}
          subtitle="From a single contractor for a six-week sprint to a 40-person delivery team for a multi-year transformation — same partner, same SLA, same quarterly review."
        />

        <div className="mt-12 space-y-20 sm:space-y-24">
          <FeatureRow
            eyebrow="Staff Augmentation"
            title="Pre-vetted contractors, billing in days."
            body="Contract and contract-to-hire IT specialists across cloud, data, ERP, application, and security. Engineers our delivery leads have personally worked with — not faceless rate sheets."
            icon={UserPlus}
            tint="brand"
            align="left"
            href="/services#staffing"
          >
            <StaffPipelineMock />
          </FeatureRow>

          <FeatureRow
            eyebrow="Direct Hire"
            title="Hire the ones you'd keep."
            body="Retained search for senior IT, engineering, and leadership roles — 6-month replacement guarantee, transparent flat-fee, no exclusivity strings."
            icon={ClipboardCheck}
            tint="violet"
            align="right"
            href="/services#direct-hire"
          >
            <DirectHireMock />
          </FeatureRow>

          <FeatureRow
            eyebrow="Project Consulting"
            title="SOW work, shipped on time."
            body="Fixed-scope engagements with a named delivery lead, weekly burn-down, and no scope creep without your signature. ERP, cloud migration, data platform, application modernisation."
            icon={Briefcase}
            tint="teal"
            align="left"
            href="/services#consulting"
          >
            <EngagementBoardMock />
          </FeatureRow>

          <FeatureRow
            eyebrow="Managed Services"
            title="Operate the thing you just built."
            body="Co-managed and fully-managed IT support — application maintenance, L1/L2/L3 helpdesk, cloud operations. Tier-based pricing, quarterly business reviews, single accountable point of contact."
            icon={Wrench}
            tint="amber"
            align="right"
            href="/services#managed"
          >
            <AccountHealthMock />
          </FeatureRow>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Feature row scaffolding
   ============================================================ */

const tintMap = {
  brand:  { bg: "bg-[var(--reg-brand-50)]",  text: "text-[var(--reg-brand-700)]", border: "border-[var(--reg-brand-200)]" },
  teal:   { bg: "bg-[#ecfdf3]",              text: "text-[#067647]",              border: "border-[#abefc6]"           },
  violet: { bg: "bg-[#f4f3ff]",              text: "text-[#5925dc]",              border: "border-[#d9d6fe]"           },
  amber:  { bg: "bg-[#fffaeb]",              text: "text-[#b54708]",              border: "border-[#fedf89]"           },
};

function FeatureRow({
  eyebrow, title, body, icon: Icon, tint, align, href, children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  icon: LucideIcon;
  tint: keyof typeof tintMap;
  align: "left" | "right";
  href: string;
  children: React.ReactNode;
}) {
  const t = tintMap[tint];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-12 items-center gap-6 lg:gap-12"
    >
      <div className={`col-span-12 lg:col-span-5 ${align === "right" ? "lg:order-2" : ""}`}>
        <div className={`inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-[11px] font-bold uppercase tracking-wider ${t.bg} ${t.text} ${t.border}`}>
          <Icon className="h-3 w-3" strokeWidth={2.5} />
          {eyebrow}
        </div>
        <h3 className="mt-4 text-[26px] font-semibold leading-[1.05] tracking-tight text-[var(--reg-text-primary)] sm:text-[36px] lg:text-[40px]">
          {title}
        </h3>
        <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-[var(--reg-text-secondary)] sm:text-[15px]">
          {body}
        </p>
        <Link
          href={href}
          className={`mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold transition-all hover:gap-2 ${t.text}`}
        >
          Read the practice
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
        className={`col-span-12 lg:col-span-7 ${align === "right" ? "lg:order-1" : ""}`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   Mocks — distinct per row, all consulting/staffing-true
   ============================================================ */

/* Staff augmentation pipeline: candidates by stage */
function StaffPipelineMock() {
  const candidates = [
    { name: "Priya M.",   role: "Sr. Cloud Architect · AWS",        loc: "Austin · remote",     rate: "$172/hr", stage: "On project", color: "text-[var(--reg-success-700)]" },
    { name: "Daniel O.",  role: "Staff ML Engineer · GCP",          loc: "Toronto · hybrid",    rate: "$180/hr", stage: "Offer out",  color: "text-[var(--reg-warning-700)]"  },
    { name: "Anika S.",   role: "Platform SRE · Kubernetes",        loc: "NYC · onsite",        rate: "$155/hr", stage: "Interview",  color: "text-[var(--reg-brand-700)]"   },
    { name: "Rafael M.",  role: "SAP S/4 Functional Lead",          loc: "Columbus · hybrid",   rate: "$165/hr", stage: "Shortlist",  color: "text-[var(--reg-text-subtle)]" },
  ];
  return (
    <div className="rounded-2xl border border-[var(--reg-line)] bg-[var(--reg-surface)] p-4 shadow-[var(--reg-shadow-lg)] sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--reg-text-tertiary)]">
          Talent pipeline · req-2284
        </p>
        <span className="reg-tnum inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--reg-text-secondary)]">
          4 active <span className="text-[var(--reg-text-tertiary)]">/ 12 vetted</span>
        </span>
      </div>

      <ul className="space-y-1.5">
        {candidates.map((c) => (
          <li
            key={c.name}
            className="grid grid-cols-12 items-center gap-3 rounded-lg border border-[var(--reg-line)] bg-[var(--reg-surface-2)] px-3 py-2.5"
          >
            <div className="col-span-1">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--reg-brand-100)] text-[11.5px] font-semibold text-[var(--reg-brand-700)]">
                {c.name.split(" ").map((p) => p[0]).join("")}
              </div>
            </div>
            <div className="col-span-5 min-w-0 sm:col-span-6">
              <p className="truncate text-[12.5px] font-semibold text-[var(--reg-text-primary)] sm:text-[13px]">{c.name}</p>
              <p className="truncate text-[11px] text-[var(--reg-text-subtle)]">{c.role}</p>
              <p className="truncate text-[10.5px] text-[var(--reg-text-tertiary)] sm:hidden">{c.loc}</p>
            </div>
            <div className="col-span-3 hidden text-right sm:block">
              <p className="reg-tnum text-[12.5px] font-semibold text-[var(--reg-text-primary)]">{c.rate}</p>
              <p className="truncate text-[10.5px] text-[var(--reg-text-tertiary)]">{c.loc}</p>
            </div>
            <div className="col-span-6 text-right sm:col-span-2">
              <span className={`text-[10.5px] font-bold uppercase tracking-wider ${c.color}`}>
                {c.stage}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <button className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[var(--reg-brand-600)] text-[12.5px] font-semibold text-white transition-colors hover:bg-[var(--reg-brand-700)]">
        Schedule 3 interviews · Tuesday AM
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* Direct hire — search funnel + retained metrics */
function DirectHireMock() {
  const funnel = [
    { stage: "Sourced",     val: 86 },
    { stage: "Vetted",      val: 24 },
    { stage: "Submitted",   val: 8 },
    { stage: "Offer / accept", val: 1 },
  ];
  const max = Math.max(...funnel.map((f) => f.val));

  return (
    <div className="rounded-2xl border border-[var(--reg-line)] bg-[var(--reg-surface)] p-4 shadow-[var(--reg-shadow-lg)] sm:p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--reg-text-tertiary)]">
            Retained search · VP Platform Engineering
          </p>
          <p className="mt-0.5 text-[15px] font-semibold leading-none text-[var(--reg-text-primary)]">
            Apex Financial · 38 days in
          </p>
        </div>
        <span className="reg-tnum inline-flex items-center gap-1 rounded-full bg-[var(--reg-success-50)] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--reg-success-700)] ring-1 ring-[var(--reg-success-200)]">
          On track
        </span>
      </div>

      <ul className="space-y-2.5">
        {funnel.map((f, i) => (
          <motion.li
            key={f.stage}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div className="mb-1 flex items-baseline justify-between text-[12px]">
              <span className="font-semibold text-[var(--reg-text-primary)]">{f.stage}</span>
              <span className="reg-tnum text-[var(--reg-text-secondary)]">{f.val}</span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--reg-surface-3)]">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(f.val / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.0, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-y-0 left-0 rounded-full bg-[var(--reg-brand-600)]"
              />
            </div>
          </motion.li>
        ))}
      </ul>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[var(--reg-line)] pt-4">
        {[
          { k: "Time-to-fill", v: "42 d" },
          { k: "Comp midpoint", v: "$245k" },
          { k: "Guarantee", v: "6 mo" },
        ].map((kpi) => (
          <div key={kpi.k} className="rounded-md bg-[var(--reg-surface-2)] p-2.5">
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
  );
}

/* Project consulting — engagement timeline + status */
function EngagementBoardMock() {
  const phases = [
    { name: "Discovery & blueprint", days: 14, done: true,  desc: "Stakeholder interviews, current-state map." },
    { name: "Wave 1 build",          days: 28, done: true,  desc: "Foundations, integrations, smoke tests." },
    { name: "UAT & training",        days: 21, done: false, current: true, desc: "Business sign-off, user enablement." },
    { name: "Cutover & hypercare",   days: 14, done: false, desc: "Go-live, hypercare, knowledge transfer." },
  ];
  const totalDays = phases.reduce((a, p) => a + p.days, 0);
  let acc = 0;

  return (
    <div className="rounded-2xl border border-[var(--reg-line)] bg-[var(--reg-surface)] p-4 shadow-[var(--reg-shadow-lg)] sm:p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--reg-text-tertiary)]">
            Engagement · Continental Energy
          </p>
          <p className="mt-0.5 text-[15px] font-semibold leading-none text-[var(--reg-text-primary)]">
            SAP S/4 HANA · 9 states
          </p>
        </div>
        <span className="reg-tnum text-[11.5px] font-semibold text-[var(--reg-success-700)]">
          on track
        </span>
      </div>

      {/* Timeline */}
      <div className="relative mb-4 h-2 w-full overflow-hidden rounded-full bg-[var(--reg-surface-3)]">
        {phases.map((p, i) => {
          const start = (acc / totalDays) * 100;
          acc += p.days;
          const w = (p.days / totalDays) * 100;
          return (
            <motion.div
              key={i}
              initial={{ width: 0 }}
              whileInView={{ width: `${w}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute top-0 h-full ${
                p.done ? "bg-[var(--reg-brand-600)]" : p.current ? "bg-[var(--reg-brand-300)]" : "bg-[var(--reg-line)]"
              }`}
              style={{ left: `${start}%` }}
            />
          );
        })}
      </div>

      <ul className="space-y-1.5">
        {phases.map((p) => (
          <li
            key={p.name}
            className="grid grid-cols-12 items-center gap-2 rounded-lg border border-[var(--reg-line)] bg-[var(--reg-surface-2)] px-3 py-2"
          >
            <div className="col-span-1">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  p.done
                    ? "bg-[var(--reg-brand-600)] text-white"
                    : p.current
                    ? "border border-[var(--reg-brand-600)] bg-[var(--reg-brand-50)] text-[var(--reg-brand-700)]"
                    : "border border-[var(--reg-line-2)] bg-[var(--reg-surface)] text-[var(--reg-text-tertiary)]"
                }`}
              >
                {p.done ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
            </div>
            <div className="col-span-9 min-w-0">
              <p className="truncate text-[12.5px] font-semibold text-[var(--reg-text-primary)] sm:text-[13px]">
                {p.name}
              </p>
              <p className="hidden truncate text-[11px] text-[var(--reg-text-subtle)] sm:block">
                {p.desc}
              </p>
            </div>
            <div className="col-span-2 text-right">
              <span className="reg-tnum text-[11px] text-[var(--reg-text-subtle)]">{p.days}d</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Managed services — quarterly business review snapshot */
function AccountHealthMock() {
  const accounts = [
    { client: "Northeast Health",  tier: "Tier 1", health: "healthy",   nps: 67, ticketsMTD: 142, slaMet: 99.7 },
    { client: "Apex Financial",    tier: "Tier 1", health: "healthy",   nps: 58, ticketsMTD: 96,  slaMet: 99.9 },
    { client: "Global Logistics",  tier: "Tier 2", health: "watching",  nps: 41, ticketsMTD: 211, slaMet: 98.2 },
  ];
  const healthMap = {
    healthy:  "bg-[var(--reg-success-50)] text-[var(--reg-success-700)] ring-[var(--reg-success-200)]",
    watching: "bg-[var(--reg-warning-50)] text-[var(--reg-warning-700)] ring-[var(--reg-warning-200)]",
    risk:     "bg-[var(--reg-error-50)] text-[var(--reg-error-700)] ring-[var(--reg-error-200)]",
  } as const;

  return (
    <div className="rounded-2xl border border-[var(--reg-line)] bg-[var(--reg-surface)] p-4 shadow-[var(--reg-shadow-lg)] sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--reg-text-tertiary)]">
          Managed accounts · QBR snapshot
        </p>
        <span className="reg-tnum inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--reg-text-secondary)]">
          Q2 · 2026
        </span>
      </div>

      <ul className="space-y-1.5">
        {accounts.map((a) => (
          <li
            key={a.client}
            className="grid grid-cols-12 items-center gap-3 rounded-lg border border-[var(--reg-line)] bg-[var(--reg-surface-2)] px-3 py-2.5"
          >
            <div className="col-span-5 min-w-0">
              <p className="truncate text-[13px] font-semibold text-[var(--reg-text-primary)]">{a.client}</p>
              <p className="truncate text-[11px] text-[var(--reg-text-subtle)]">{a.tier} · NPS {a.nps}</p>
            </div>
            <div className="col-span-4 hidden sm:block">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--reg-text-tertiary)]">
                Tickets · MTD
              </p>
              <p className="reg-tnum text-[12.5px] font-semibold text-[var(--reg-text-primary)]">
                {a.ticketsMTD}
              </p>
            </div>
            <div className="col-span-4 hidden text-right sm:block">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--reg-text-tertiary)]">
                SLA met
              </p>
              <p className="reg-tnum text-[12.5px] font-semibold text-[var(--reg-success-700)]">
                {a.slaMet}%
              </p>
            </div>
            <div className="col-span-7 text-right sm:col-span-3 sm:text-right">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider ring-1 ${healthMap[a.health as keyof typeof healthMap]}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {a.health}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--reg-line)] pt-3">
        {[
          { k: "MTTA", v: "42 s" },
          { k: "MTTR", v: "11 m" },
          { k: "CSAT", v: "4.7 / 5" },
        ].map((kpi) => (
          <div key={kpi.k} className="rounded-md bg-[var(--reg-surface-2)] p-2.5 text-center">
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
  );
}
