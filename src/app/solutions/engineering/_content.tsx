"use client";

import {
  Cog, Zap, Building2, Plane, Factory, CircuitBoard, ShieldCheck,
  BatteryCharging, RadioTower, Search, ClipboardCheck, Users, LifeBuoy,
  FileText, Repeat2, UserCheck, ClipboardList, Car, Truck, Wifi,
  Handshake, Clock, Award, Layers, ArrowRight, type LucideIcon,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Eyebrow, Cta } from "@/components/landing/ui";
import Photo from "@/components/landing/Photo";
import { IMG } from "@/components/landing/media";

/* ============================================================
   Engineering segment — a co-equal fourth practice.
   Follows the Horizon rhythm: hero → trust bar → disciplines →
   industries → engagement → delivery → why → CTA. Self-contained:
   no shared landing sections (stats / certifications) are repeated.
   Positioning language is kept defensible; industry standards are
   market context, not company-level certifications.
   ============================================================ */

type Discipline = { icon: LucideIcon; title: string; roles: string };

const disciplines: Discipline[] = [
  { icon: Cog,           title: "Mechanical",              roles: "Design & CAD, FEA/simulation, thermal & HVAC, product development" },
  { icon: Zap,           title: "Electrical & Electronics", roles: "PCB & power systems, embedded, wiring & harness, test" },
  { icon: Building2,     title: "Structural & Civil",       roles: "Structural analysis, steel & concrete design, site & infrastructure" },
  { icon: Plane,         title: "Aerospace",                roles: "Stress & systems, flight controls, tooling, AS9100 environments" },
  { icon: Factory,       title: "Manufacturing & Industrial", roles: "Process & lean, tooling & fixtures, new-product introduction" },
  { icon: CircuitBoard,  title: "Controls & Automation",    roles: "PLC/HMI, SCADA, robotics & cell integration" },
  { icon: ShieldCheck,   title: "Quality & Reliability",    roles: "APQP/PPAP, reliability, supplier & process quality" },
  { icon: BatteryCharging, title: "Power & Energy",         roles: "T&D, substation, protection & controls, renewables" },
  { icon: RadioTower,    title: "Communications & RF",      roles: "RF & antenna, wireless, telecom & network engineering" },
];

type Industry = { icon: LucideIcon; name: string; standards: string };

const industries: Industry[] = [
  { icon: Car,     name: "Automotive",             standards: "IATF 16949 · APQP / PPAP" },
  { icon: Factory, name: "Manufacturing",          standards: "ISO 9001 · Lean / Six Sigma" },
  { icon: Plane,   name: "Aerospace & Defense",    standards: "AS9100 · ITAR-aware†" },
  { icon: Zap,     name: "Power & Utilities",      standards: "NERC · IEEE" },
  { icon: Wifi,    name: "Communications",         standards: "3GPP · FCC" },
  { icon: Truck,   name: "Industrial & Heavy Equipment", standards: "ISO · CE marking" },
];

type Model = { icon: LucideIcon; title: string; desc: string; best: string };

const models: Model[] = [
  { icon: FileText,     title: "By the project",     desc: "Engineers who scale your program up or down as the workload moves.", best: "Best for peak demand and fixed-term programs" },
  { icon: Repeat2,      title: "Try before you hire", desc: "Prove the fit on a real deliverable before you bring someone on permanently.", best: "Best for de-risking a permanent hire" },
  { icon: UserCheck,    title: "Permanent hire",     desc: "We run the search and vetting; you make the permanent hire.", best: "Best for core, long-term roles" },
  { icon: ClipboardList, title: "Managed project team", desc: "An outcome-based statement of work where we own scope, staffing, and delivery.", best: "Best for defined work packages" },
];

const steps = [
  { no: "01", icon: Search,        title: "Scope",     desc: "We learn the program, the disciplines, and the standards that matter — before we source anyone." },
  { no: "02", icon: ClipboardCheck, title: "Vet",      desc: "Technical screening, background and reference checks, credential verification on request." },
  { no: "03", icon: Users,         title: "Shortlist", desc: "A curated shortlist of pre-vetted engineers — typically within 48 hours of an agreed scope." },
  { no: "04", icon: LifeBuoy,      title: "Support",   desc: "We stay accountable through onboarding, delivery, and the length of the engagement." },
];

type Why = { icon: LucideIcon; title: string; desc: string };

const why: Why[] = [
  { icon: Layers,      title: "Multi-discipline depth",   desc: "Mechanical to controls to RF — one partner across the disciplines your program touches." },
  { icon: Factory,     title: "Industry fluency",         desc: "We speak automotive, aerospace, power, and manufacturing — standards and cadence included." },
  { icon: Handshake,   title: "One accountable partner",  desc: "A single point of ownership from scope to delivery — not a résumé firehose." },
  { icon: Clock,       title: "Fast, curated shortlists", desc: "A pre-vetted engineering network, shortlisted to fit — not padded to volume." },
  { icon: ShieldCheck, title: "Quality & compliance",     desc: "Vetting, NDAs, and secure handling built into how we work, aligned to your standards." },
  { icon: Award,       title: "MWBE differentiation",     desc: "A certified minority- and women-owned partner that adds to your supplier-diversity goals." },
];

export default function EngineeringContent() {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      {/* ---------- Hero ---------- */}
      <section className="relative isolate flex min-h-[68vh] w-full items-center overflow-hidden" style={{ background: "#07142b" }}>
        <Photo src={IMG.serviceEngineering} className="z-0" fallback="linear-gradient(135deg, #0e2147 0%, #07142b 100%)" priority sizes="100vw" />
        <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(100deg, rgba(5,12,28,0.95) 0%, rgba(7,20,43,0.86) 38%, rgba(7,20,43,0.5) 72%, rgba(7,20,43,0.3) 100%)" }} />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-32 pb-20 sm:px-8">
          <Reveal>
            <Eyebrow tone="dark">Engineering talent &amp; services</Eyebrow>
            <h1 className="hz-display mt-7 max-w-[20ch] text-[2.5rem] text-white sm:text-[3.25rem] lg:text-[4rem]">
              The engineers behind what you design, test, and build.
            </h1>
            <p className="mt-7 max-w-2xl text-[16px] leading-relaxed text-white/75 sm:text-[18px]">
              Mechanical, electrical, structural, aerospace, controls and manufacturing engineers who
              join your program and own the work — across automotive, manufacturing, aerospace,
              power, and communications.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {["By the project", "Try before you hire", "Permanent hire", "Managed teams"].map((m) => (
                <span key={m} className="rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[12.5px] font-medium text-white/80">
                  {m}
                </span>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Cta href="/contact" variant="primary" icon={ArrowRight}>Start a conversation</Cta>
              <a href="#disciplines" className="hz-btn-ghost-dark">Explore disciplines</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Industries trust bar ---------- */}
      <section className="relative w-full border-b border-slate-200/70 bg-[var(--hz-ivory)] py-10">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="flex flex-col items-center gap-6 text-center">
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-[var(--hz-text-subtle)]">
              Engineering talent across the markets that build things
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-12">
              {industries.map((it) => (
                <span key={it.name} className="flex items-center gap-2 text-[14px] font-semibold text-[var(--hz-text)]">
                  <it.icon className="h-4 w-4 text-[var(--hz-cobalt)]" strokeWidth={1.75} />
                  {it.name}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Disciplines grid (9) ---------- */}
      <section id="disciplines" className="relative w-full scroll-mt-24 bg-[var(--hz-canvas)] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <span aria-hidden className="block h-[3px] w-12 rounded-full bg-[var(--hz-amber)]" />
            <h2 className="hz-display mt-7 text-[2.25rem] text-[var(--hz-text)] sm:text-[3rem]">
              Nine disciplines, real depth in each.
            </h2>
            <p className="mt-6 text-[16px] leading-relaxed text-[var(--hz-text-mute)]">
              We shortlist for the specific discipline and the standards behind it — so the engineers
              who arrive can own the work from day one.
            </p>
          </Reveal>

          <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" gap={0.08}>
            {disciplines.map((d) => (
              <StaggerItem key={d.title} className="h-full">
                <div className="hz-card h-full p-7">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
                    <d.icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="hz-display mt-6 text-[1.3rem] text-[var(--hz-text)]">{d.title}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-[var(--hz-text-mute)]">{d.roles}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------- Industries (dark, with standards) ---------- */}
      <section className="relative isolate w-full overflow-hidden py-24 sm:py-32" style={{ background: "#07142b" }}>
        <div aria-hidden className="absolute inset-0 z-0" style={{ background: "radial-gradient(60% 80% at 50% 0%, rgba(29,78,216,0.28), transparent 60%)" }} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <span aria-hidden className="block h-[3px] w-12 rounded-full bg-[var(--hz-cyan-400)]" />
            <h2 className="hz-display mt-7 text-[2.25rem] text-white sm:text-[3rem]">
              Fluent in the industries and their standards.
            </h2>
            <p className="mt-6 text-[16px] leading-relaxed text-white/70">
              We know the frameworks each market is held to, so vetting is aligned to how you actually work.
            </p>
          </Reveal>

          <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={0.08}>
            {industries.map((it) => (
              <StaggerItem key={it.name} className="h-full">
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-7 transition-colors duration-300 hover:bg-white/[0.07]">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white">
                    <it.icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="hz-display mt-6 text-[1.3rem] text-white">{it.name}</h3>
                  <p className="mt-2 text-[13px] font-medium uppercase tracking-[0.1em] text-[var(--hz-cyan-400)]">{it.standards}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal>
            <p className="mt-10 max-w-3xl text-[12.5px] leading-relaxed text-white/45">
              &dagger; Standards are shown as market context and reflect the frameworks common to each
              industry — not company-level certifications. &ldquo;ITAR-aware&rdquo; indicates familiarity with
              export-control requirements; cleared-personnel access is confirmed per engagement.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------- Engagement models ---------- */}
      <section className="relative w-full bg-[var(--hz-canvas)] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <span aria-hidden className="block h-[3px] w-12 rounded-full bg-[var(--hz-amber)]" />
            <h2 className="hz-display mt-7 text-[2.25rem] text-[var(--hz-text)] sm:text-[3rem]">
              Four ways to engage the talent.
            </h2>
          </Reveal>
          <Stagger className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4" gap={0.1}>
            {models.map((m) => (
              <StaggerItem key={m.title} className="h-full">
                <div className="hz-card flex h-full flex-col p-7">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
                    <m.icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="hz-display mt-6 text-[1.3rem] text-[var(--hz-text)]">{m.title}</h3>
                  <p className="mt-3 flex-1 text-[14px] leading-relaxed text-[var(--hz-text-mute)]">{m.desc}</p>
                  <p className="mt-5 border-t border-black/[0.08] pt-4 text-[12.5px] font-semibold text-[var(--hz-cobalt)]">{m.best}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------- How we deliver ---------- */}
      <section className="relative w-full bg-[var(--hz-surface-2)] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <span aria-hidden className="block h-[3px] w-12 rounded-full bg-[var(--hz-amber)]" />
            <h2 className="hz-display mt-7 text-[2.25rem] text-[var(--hz-text)] sm:text-[3rem]">
              Scope. Vet. Shortlist. Support.
            </h2>
            <p className="mt-6 text-[16px] leading-relaxed text-[var(--hz-text-mute)]">
              A method you can hold us to — the same discipline behind a decade of delivery without a missed SLA.
            </p>
          </Reveal>
          <Stagger className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4" gap={0.1}>
            {steps.map((st) => (
              <StaggerItem key={st.no} className="h-full">
                <div className="hz-card h-full p-7">
                  <div className="flex items-center justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
                      <st.icon className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <span className="hz-display text-[1.5rem] text-black/10">{st.no}</span>
                  </div>
                  <h3 className="hz-display mt-6 text-[1.3rem] text-[var(--hz-text)]">{st.title}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-[var(--hz-text-mute)]">{st.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------- Why Ocean Blue + stats ---------- */}
      <section className="relative w-full overflow-hidden border-y border-slate-200/70 bg-[var(--hz-ivory)] py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl items-start gap-14 px-6 sm:px-8 lg:grid-cols-12 lg:gap-12">
          <Reveal className="lg:col-span-5 lg:sticky lg:top-28">
            <span aria-hidden className="block h-[3px] w-12 rounded-full bg-[var(--hz-amber)]" />
            <h2 className="hz-display mt-7 text-[2rem] leading-[1.08] text-[var(--hz-text)] sm:text-[2.75rem]">
              Why teams bring engineering to Ocean Blue.
            </h2>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-[var(--hz-text-mute)]">
              One accountable partner across disciplines and industries — with the MWBE
              differentiation the large engineering firms can&apos;t claim.
            </p>
            <div className="mt-8">
              <Cta href="/contact" variant="primary" icon={ArrowRight}>Talk to our engineering team</Cta>
            </div>
          </Reveal>

          <Stagger className="grid gap-6 sm:grid-cols-2 lg:col-span-7" gap={0.08}>
            {why.map((w) => (
              <StaggerItem key={w.title} className="h-full">
                <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
                    <w.icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="hz-display mt-6 text-[1.2rem] text-[var(--hz-text)]">{w.title}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-[var(--hz-text-mute)]">{w.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="relative isolate w-full overflow-hidden" style={{ background: "#07142b" }}>
        <Photo src={IMG.cta} className="z-0" fallback="linear-gradient(135deg, #0e2147 0%, #07142b 100%)" />
        <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(5,12,28,0.9) 0%, rgba(7,20,43,0.84) 100%), radial-gradient(60% 80% at 50% 0%, rgba(29,78,216,0.4), transparent 60%)" }} />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center sm:px-8 sm:py-32">
          <Reveal className="flex flex-col items-center">
            <Eyebrow tone="dark">Let&apos;s talk</Eyebrow>
            <h2 className="hz-display mt-7 max-w-[18ch] text-[2.25rem] text-white sm:text-[3rem]">
              Tell us what you&apos;re engineering.
            </h2>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/70 sm:text-[17px]">
              We&apos;ll put the right engineers on it and stand behind the result — one accountable partner.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Cta href="/contact" variant="primary" icon={ArrowRight}>Book a discovery call</Cta>
              <Cta href="/solutions" variant="ghostDark">All solutions</Cta>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
