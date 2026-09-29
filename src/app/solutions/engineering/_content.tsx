import PageHero from "@/components/landing/PageHero";
import { IMG } from "@/components/landing/media";
import { LinkButton } from "@/components/site/button";
import { Section, ClosingCta } from "@/components/site/sections";
import {
  IconClock, IconTalent, IconBriefcase, IconPackage, IconLayers, IconBuilding,
  IconTeam, IconShieldLock, IconCheck, type Icon,
} from "@/components/site/icons";

/* Engineering is the spec sheet of the site. Its reader is technical and is
   scanning for their discipline, their industry and their standard, so the
   page is built as reference grids: dense, scannable, no photography between
   the reader and the answer.

   The standards listed against each industry are market context, not
   Ocean Blue certifications, and the page says so. */

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

const models: { title: string; desc: string; best: string; icon: Icon }[] = [
  { icon: IconClock, title: "By the project", desc: "Engineers who scale your program up or down as the workload moves.", best: "Peak demand and fixed-term programs" },
  { icon: IconTalent, title: "Try before you hire", desc: "Prove the fit on a real deliverable before you bring someone on permanently.", best: "De-risking a permanent hire" },
  { icon: IconBriefcase, title: "Permanent hire", desc: "We run the search and vetting; you make the permanent hire.", best: "Core, long-term roles" },
  { icon: IconPackage, title: "Managed project team", desc: "An outcome-based statement of work where we own scope, staffing, and delivery.", best: "Defined work packages" },
];

const steps = [
  { title: "Scope", desc: "We learn the program, the disciplines, and the standards that matter, before we source anyone." },
  { title: "Vet", desc: "Technical screening, background and reference checks, credential verification on request." },
  { title: "Shortlist", desc: "A curated shortlist of pre-vetted engineers, typically within 48 hours of an agreed scope." },
  { title: "Support", desc: "We stay accountable through onboarding, delivery, and the length of the engagement." },
];

const why: { title: string; desc: string; icon: Icon }[] = [
  { icon: IconLayers, title: "Multi-discipline depth", desc: "Mechanical to controls to RF, one partner across the disciplines your program touches." },
  { icon: IconBuilding, title: "Industry fluency", desc: "We speak automotive, aerospace, power, and manufacturing, standards and cadence included." },
  { icon: IconTeam, title: "One accountable partner", desc: "A single point of ownership from scope to delivery, not a resume firehose." },
  { icon: IconTalent, title: "Fast, curated shortlists", desc: "A pre-vetted engineering network, shortlisted to fit, not padded to volume." },
  { icon: IconShieldLock, title: "Quality & compliance", desc: "Vetting, NDAs, and secure handling built into how we work, aligned to your standards." },
  { icon: IconCheck, title: "MWBE differentiation", desc: "A certified minority- and women-owned partner that adds to your supplier-diversity goals." },
];

export default function EngineeringContent() {
  return (
    <>
      <PageHero
        eyebrow="Engineering Talent & Services"
        title="The engineers behind what you design, test, and build."
        subtitle="Mechanical, electrical, structural, aerospace, controls and manufacturing engineers who join your program and own the work."
        image={IMG.serviceEngineering}
        actions={
          <>
            <LinkButton href="/contact" variant="primary" size="lg">
              Talk to us
            </LinkButton>
            <LinkButton href="#disciplines" variant="outline" size="lg">
              Explore disciplines
            </LinkButton>
          </>
        }
      />

      <Section
        id="disciplines"
        tone="white"
        title="Nine disciplines"
        sub="One partner across the engineering disciplines your program actually touches, rather than a separate vendor for each."
      >
        <dl className="grid gap-[3px] bg-line sm:grid-cols-2 lg:grid-cols-3">
          {disciplines.map((d) => (
            <div key={d.title} className="bg-white p-7">
              <dt className="type-title text-ink">{d.title}</dt>
              <dd className="mt-2 type-body-sm text-ink-muted">{d.roles}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section tone="paper" title="The markets that build things" sub="The industries we staff, and the standards their programs run to.">
        <div className="mx-auto max-w-[880px] overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-paper text-[13.5px] text-ink-subtle">
                <th scope="col" className="px-6 py-3.5 font-medium">Industry</th>
                <th scope="col" className="px-6 py-3.5 font-medium">Standards</th>
              </tr>
            </thead>
            <tbody>
              {industries.map((i) => (
                <tr key={i.name} className="border-b border-line last:border-b-0">
                  <th scope="row" className="px-6 py-4 text-[15.5px] font-semibold text-ink">{i.name}</th>
                  <td className="px-6 py-4 text-[15px] text-ink-muted">{i.standards}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mx-auto mt-4 max-w-[880px] text-[13.5px] text-ink-subtle">
          Standards are the ones our clients&apos; programs work to. They are market context, not Ocean Blue certifications.
        </p>
      </Section>

      <Section tone="white" title="Four ways to engage" sub="Pick the model that matches the work, not the one that suits a vendor.">
        <ul className="grid gap-[3px] bg-line sm:grid-cols-2 lg:grid-cols-4">
          {models.map((m) => (
            <li key={m.title} className="flex flex-col bg-white p-7">
              <span className="flex size-10 items-center justify-center rounded-lg border border-line text-ink">
                <m.icon size={18} />
              </span>
              <h3 className="mt-6 type-title text-ink">{m.title}</h3>
              <p className="mt-2 type-body-sm text-ink-muted">{m.desc}</p>
              <p className="mt-auto pt-5 text-[13.5px] font-semibold text-cobalt">Best for {m.best.toLowerCase()}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="paper" title="How we deliver">
        <ol className="relative grid gap-8 md:grid-cols-4 md:gap-6">
          <span aria-hidden className="absolute top-5 right-[12.5%] left-[12.5%] hidden h-px bg-line-strong md:block" />
          {steps.map((st, i) => (
            <li key={st.title} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
              <span className="relative flex size-10 flex-none items-center justify-center rounded-full border border-line-strong bg-white text-[14px] font-semibold text-ink tabular-nums">
                {i + 1}
              </span>
              <div>
                <h3 className="type-title text-ink md:mt-5">{st.title}</h3>
                <p className="mt-1.5 type-body-sm text-ink-muted">{st.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="white" title="Why teams bring engineering to Ocean Blue">
        <ul className="grid gap-[3px] bg-line sm:grid-cols-2 lg:grid-cols-3">
          {why.map((w) => (
            <li key={w.title} className="bg-white p-7">
              <w.icon size={22} className="text-cobalt" />
              <h3 className="mt-5 type-title text-ink">{w.title}</h3>
              <p className="mt-2 type-body-sm text-ink-muted">{w.desc}</p>
            </li>
          ))}
        </ul>
      </Section>

      <ClosingCta
        title="Tell us what you are building"
        sub="Give us the program and the disciplines, and we will come back with a shortlist you can actually interview."
        primary={{ href: "/contact", label: "Talk to our engineering team" }}
        secondary={{ href: "/solutions", label: "All solutions" }}
      />
    </>
  );
}
