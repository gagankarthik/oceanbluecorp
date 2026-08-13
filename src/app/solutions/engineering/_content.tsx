"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Cta } from "@/components/landing/ui";
import { AccentHeading } from "@/components/landing/bands";
import Photo from "@/components/landing/Photo";
import {
  CalendarClock, UserRoundCheck, UserRoundPlus, PackageCheck,
  Layers3, Factory, Handshake, ListFilter, BadgeCheck, Award,
  type LucideIcon,
} from "lucide-react";
import PageHero from "@/components/landing/PageHero";
import { IMG } from "@/components/landing/media";

/* Engineering is the SPEC SHEET of the site. Its reader is technical and is
   scanning for whether we cover their discipline, their industry and their
   standard, so the page is built as tables: dense, scannable, mono labels, no
   photography between the reader and the answer.

   Positioning language is kept defensible. The standards listed against each
   industry are market context, not Ocean Blue certifications. */

const disciplines = [
  { title: "Mechanical", roles: "Design & CAD, FEA/simulation, thermal & HVAC, product development" },
  { title: "Electrical & Electronics", roles: "PCB & power systems, embedded, wiring & harness, test" },
  { title: "Structural & Civil", roles: "Structural analysis, steel & concrete design, site & infrastructure" },
  { title: "Aerospace", roles: "Stress & systems, flight controls, tooling, AS9100 environments" },
  { title: "Manufacturing & Industrial", roles: "Process & lean, tooling & fixtures, new-product introduction" },
  { title: "Controls & Automation", roles: "PLC/HMI, SCADA, robotics & cell integration" },
  { title: "Quality & Reliability", roles: "APQP/PPAP, reliability, supplier & process quality" },
  { title: "Power & Energy", roles: "T&D, substation, protection & controls, renewables" },
  { title: "Communications & RF", roles: "RF & antenna, wireless, telecom & network engineering" },
];

const industries = [
  { name: "Automotive", standards: "IATF 16949, APQP / PPAP" },
  { name: "Manufacturing", standards: "ISO 9001, Lean / Six Sigma" },
  { name: "Aerospace & Defense", standards: "AS9100, ITAR-aware" },
  { name: "Power & Utilities", standards: "NERC, IEEE" },
  { name: "Communications", standards: "3GPP, FCC" },
  { name: "Industrial & Heavy Equipment", standards: "ISO, CE marking" },
];

const models: { title: string; desc: string; best: string; icon: LucideIcon }[] = [
  { icon: CalendarClock, title: "By the project", desc: "Engineers who scale your program up or down as the workload moves.", best: "Peak demand and fixed-term programs" },
  { icon: UserRoundCheck, title: "Try before you hire", desc: "Prove the fit on a real deliverable before you bring someone on permanently.", best: "De-risking a permanent hire" },
  { icon: UserRoundPlus, title: "Permanent hire", desc: "We run the search and vetting; you make the permanent hire.", best: "Core, long-term roles" },
  { icon: PackageCheck, title: "Managed project team", desc: "An outcome-based statement of work where we own scope, staffing, and delivery.", best: "Defined work packages" },
];

const steps = [
  { no: "01", title: "Scope", desc: "We learn the program, the disciplines, and the standards that matter, before we source anyone." },
  { no: "02", title: "Vet", desc: "Technical screening, background and reference checks, credential verification on request." },
  { no: "03", title: "Shortlist", desc: "A curated shortlist of pre-vetted engineers, typically within 48 hours of an agreed scope." },
  { no: "04", title: "Support", desc: "We stay accountable through onboarding, delivery, and the length of the engagement." },
];

const why: { title: string; desc: string; icon: LucideIcon }[] = [
  { icon: Layers3, title: "Multi-discipline depth", desc: "Mechanical to controls to RF, one partner across the disciplines your program touches." },
  { icon: Factory, title: "Industry fluency", desc: "We speak automotive, aerospace, power, and manufacturing, standards and cadence included." },
  { icon: Handshake, title: "One accountable partner", desc: "A single point of ownership from scope to delivery, not a resume firehose." },
  { icon: ListFilter, title: "Fast, curated shortlists", desc: "A pre-vetted engineering network, shortlisted to fit, not padded to volume." },
  { icon: BadgeCheck, title: "Quality & compliance", desc: "Vetting, NDAs, and secure handling built into how we work, aligned to your standards." },
  { icon: Award, title: "MWBE differentiation", desc: "A certified minority- and women-owned partner that adds to your supplier-diversity goals." },
];

/** Column heading for the spec tables. Mono and tracked, so the tables read
 *  as reference material rather than as marketing copy. */
function ColHead({ children }: { children: React.ReactNode }) {
  return <span className="hz-eyebrow block text-[var(--hz-text-subtle)]">{children}</span>;
}

export default function EngineeringContent() {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      <PageHero
        eyebrow="Engineering Talent & Services"
        title="The engineers behind what you design, test, and build."
        subtitle="Mechanical, electrical, structural, aerospace, controls and manufacturing engineers who join your program and own the work."
        image={IMG.serviceEngineering}
        actions={
          <>
            <Cta href="/contact" variant="primary">Start a conversation</Cta>
            <Cta href="#disciplines" variant="ghostLight">Explore disciplines</Cta>
          </>
        }
      />

      {/* Disciplines, as a two-column spec table. Nine rows, scannable. */}
      <section
        id="disciplines"
        className="w-full scroll-mt-24 px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24"
      >
        <Reveal className="max-w-2xl">
          <AccentHeading>Nine disciplines</AccentHeading>
          <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[19px]">
            One partner across the engineering disciplines your program actually
            touches, rather than a separate vendor for each.
          </p>
        </Reveal>

        <div className="mt-12 sm:mt-14">
          <div className="hidden grid-cols-12 gap-10 border-b border-[var(--hz-line-2)] pb-3 lg:grid">
            <div className="col-span-4"><ColHead>Discipline</ColHead></div>
            <div className="col-span-8"><ColHead>Typical roles</ColHead></div>
          </div>
          <Stagger as="dl" className="divide-y divide-[var(--hz-paper-line)] border-b border-[var(--hz-paper-line)]" gap={0.04}>
            {disciplines.map((d) => (
              <StaggerItem key={d.title}>
                <div className="grid gap-1.5 py-5 lg:grid-cols-12 lg:gap-10">
                  <dt className="hz-display text-[1.05rem] leading-tight text-[var(--hz-text)] lg:col-span-4">
                    {d.title}
                  </dt>
                  <dd className="text-[14.5px] leading-relaxed text-[var(--hz-text-mute)] lg:col-span-8">
                    {d.roles}
                  </dd>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Industries and standards, a second table beside the engagement
          models, so two short reference sets share one band. */}
      <section className="w-full border-t border-[var(--hz-line)] px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <h2 className="hz-display hz-h2 max-w-[14ch] text-[var(--hz-text)]">
                The markets that build things.
              </h2>
            </Reveal>
            <div className="mt-8 hidden grid-cols-12 gap-6 border-b border-[var(--hz-line-2)] pb-3 sm:grid">
              <div className="col-span-7"><ColHead>Industry</ColHead></div>
              <div className="col-span-5"><ColHead>Standards</ColHead></div>
            </div>
            <Stagger as="dl" className="divide-y divide-[var(--hz-paper-line)] border-b border-[var(--hz-paper-line)]" gap={0.05}>
              {industries.map((i) => (
                <StaggerItem key={i.name}>
                  <div className="grid gap-1 py-4 sm:grid-cols-12 sm:gap-6">
                    <dt className="text-[14.5px] font-semibold text-[var(--hz-text)] sm:col-span-7">{i.name}</dt>
                    <dd className="text-[13px] text-[var(--hz-text-subtle)] sm:col-span-5">{i.standards}</dd>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal>
              <h2 className="hz-display hz-h2 max-w-[14ch] text-[var(--hz-text)]">Four ways to engage.</h2>
            </Reveal>
            <Stagger as="ul" className="mt-8 divide-y divide-[var(--hz-paper-line)] border-y border-[var(--hz-paper-line)]" gap={0.06}>
              {models.map((m) => (
                <StaggerItem as="li" key={m.title} className="py-5">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
                    <m.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </span>
                  <h3 className="hz-display mt-4 text-[1.05rem] leading-tight text-[var(--hz-text)]">{m.title}</h3>
                  <p className="mt-2 max-w-[48ch] text-[14px] leading-relaxed text-[var(--hz-text-mute)]">{m.desc}</p>
                  <p className="mt-2.5 text-[12.5px] font-semibold text-[var(--hz-cobalt)]">
                    Best for {m.best.toLowerCase()}
                  </p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* Method */}
      <section className="w-full border-t border-[var(--hz-line)] px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <Reveal className="max-w-2xl">
          <h2 className="hz-display hz-h2 text-[var(--hz-text)]">How we deliver.</h2>
        </Reveal>
        <Stagger className="mt-10 grid gap-10 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8" gap={0.08}>
          {steps.map((st) => (
            <StaggerItem key={st.no}>
              <span className="hz-display hz-tnum block text-[1.6rem] leading-none text-[var(--hz-cobalt)]">
                {st.no}
              </span>
              <span aria-hidden className="mt-4 block h-px w-full bg-[var(--hz-line)]" />
              <h3 className="hz-display mt-5 text-[1.2rem] leading-tight text-[var(--hz-text)]">{st.title}</h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--hz-text-mute)]">{st.desc}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Why, as a compact two-column reference rather than another card set. */}
      <section className="w-full border-t border-[var(--hz-line)] px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <Reveal className="max-w-2xl">
          <h2 className="hz-display hz-h2 max-w-[20ch] text-[var(--hz-text)]">
            Why teams bring engineering to Ocean Blue.
          </h2>
        </Reveal>
        <Stagger as="ul" className="mt-10 grid gap-x-16 gap-y-8 sm:mt-12 sm:grid-cols-2" gap={0.06}>
          {why.map((w) => (
            <StaggerItem as="li" key={w.title}>
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--hz-surface-2)] text-[var(--hz-cobalt)]">
                <w.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <h3 className="hz-display mt-4 text-[1.05rem] leading-tight text-[var(--hz-text)]">{w.title}</h3>
              <p className="mt-2 max-w-[46ch] text-[14px] leading-relaxed text-[var(--hz-text-mute)]">{w.desc}</p>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal className="mt-12">
          <Cta href="/contact" variant="primary">Talk to our engineering team</Cta>
        </Reveal>
      </section>

      <section className="relative isolate w-full overflow-hidden">
        <div className="relative min-h-[400px] w-full sm:min-h-[460px]">
          <Photo src={IMG.serviceSolutions} alt="An engineering scoping session" sizes="100vw" priority={false} />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,23,48,0.62) 0%, rgba(10,23,48,0.82) 60%, rgba(10,23,48,0.94) 100%)",
            }}
          />
          <div className="relative z-10 flex min-h-[400px] items-center px-6 py-16 sm:min-h-[460px] sm:px-10 lg:px-16 2xl:px-24">
            <Reveal className="max-w-2xl">
              <h2 className="hz-display max-w-[18ch] text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.05] text-white">
                Tell us what you are building.
              </h2>
              <p className="mt-6 max-w-[46ch] text-[16px] leading-relaxed text-white/80 sm:text-[17px]">
                Give us the program and the disciplines, and we will come back with a
                shortlist you can actually interview.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Cta href="/contact" variant="primary">Book a discovery call</Cta>
                <Cta href="/solutions" variant="ghostDark">All solutions</Cta>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
