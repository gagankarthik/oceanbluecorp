"use client";

import {
  Users, Cloud, Shield, Database, Settings, Cpu, Headphones, Lightbulb,
  Search, Compass, Rocket, RefreshCw, ArrowRight, type LucideIcon,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Eyebrow, Cta } from "@/components/landing/ui";
import Photo from "@/components/landing/Photo";
import PageHero from "@/components/landing/PageHero";
import { IMG } from "@/components/landing/media";

type Service = { icon: LucideIcon; title: string; desc: string; capabilities: string[] };

const SERVICES: Record<string, Service> = {
  staffing: {
    icon: Users,
    title: "IT Staffing & Talent",
    desc: "Vetted specialists who integrate into your team and deliver from the first sprint, on flexible or permanent terms, or as a managed team.",
    capabilities: ["Cloud, data & security engineers", "ERP & Salesforce specialists", "AI/ML engineers & program managers", "Shortlists in 48 hours"],
  },
  cloud: {
    icon: Cloud,
    title: "Cloud Engineering",
    desc: "Migrate, optimize, and scale cloud environments with security and performance at the core.",
    capabilities: ["Migration, AWS, Azure, GCP", "Infrastructure modernization", "DevOps & CI/CD automation", "Observability & performance tuning"],
  },
  cybersecurity: {
    icon: Shield,
    title: "Cybersecurity",
    desc: "Proactive, compliance-aligned protection across cloud, identity, and applications.",
    capabilities: ["Security assessments & hardening", "Identity & access management", "Vulnerability management", "HIPAA, SOC 2, NIST compliance"],
  },
  erp: {
    icon: Database,
    title: "ERP Solutions",
    desc: "Implementations, integrations, and optimizations across SAP, Oracle, and Microsoft Dynamics.",
    capabilities: ["Implementations & upgrades", "Custom development", "Integrations & data migration", "Ongoing support"],
  },
  salesforce: {
    icon: Settings,
    title: "Salesforce Services",
    desc: "We optimize, automate, and support Salesforce environments for better visibility and performance.",
    capabilities: ["Multi-cloud implementations", "Apex & LWC development", "Workflow automation", "Managed admin services"],
  },
  ai: {
    icon: Cpu,
    title: "AI & Data Intelligence",
    desc: "Secure, business-first AI and automation, from document processing to predictive analytics.",
    capabilities: ["Workflow & document automation", "Predictive analytics", "LLM integrations", "Data engineering & BI"],
  },
  managed: {
    icon: Headphones,
    title: "Managed Services",
    desc: "We keep systems running with monitoring, support, and performance management, one accountable SLA.",
    capabilities: ["24/7 monitoring & response", "Helpdesk & application support", "Cloud & infrastructure management", "Security monitoring"],
  },
  transformation: {
    icon: Lightbulb,
    title: "Digital Transformation",
    desc: "We modernize processes, improve workflows, and adopt the right technologies, with a clear roadmap and measurable outcomes.",
    capabilities: ["Technology strategy", "Architecture & roadmaps", "Process optimization", "Change management & training"],
  },
};

type Pillar = { name: string; tag: string; desc: string; img: string; ids?: string[]; href?: string; points?: string[] };

// All four practices live here, in one place. Engineering has its own
// dedicated page, so its pillar links out rather than listing sub-services.
const pillars: Pillar[] = [
  { name: "Talent", tag: "People who deliver", img: IMG.serviceTalent, desc: "The specialists who join your team and own the work.", ids: ["staffing"] },
  {
    name: "Engineering",
    tag: "Engineers, embedded fast",
    img: IMG.serviceEngineering,
    desc: "Mechanical, electrical, structural, aerospace, controls and manufacturing engineers for the industries that build things.",
    href: "/solutions/engineering",
    points: ["Nine engineering disciplines", "Automotive, aerospace, power and manufacturing", "Flexible, permanent, or managed teams"],
  },
  { name: "Solutions", tag: "Engineering the core", img: IMG.serviceSolutions, desc: "Platform and product work, delivered securely and without disruption.", ids: ["cloud", "cybersecurity", "erp", "salesforce", "ai", "transformation"] },
  { name: "Managed", tag: "Run & optimize", img: IMG.serviceManaged, desc: "We operate and improve your systems around the clock, on one SLA.", ids: ["managed"] },
];

const steps = [
  { no: "01", icon: Search, title: "Discovery", desc: "We learn the business, the constraints, and the outcome that matters, before proposing anything." },
  { no: "02", icon: Compass, title: "Strategy", desc: "We design the solution and the roadmap together, with success metrics agreed up front." },
  { no: "03", icon: Rocket, title: "Implementation", desc: "We execute in agile increments, shipping working software and integrated talent." },
  { no: "04", icon: RefreshCw, title: "Optimization", desc: "We monitor, review, and improve continuously against the SLA, in quarterly reviews." },
];

function ServiceDetail({ id }: { id: string }) {
  const s = SERVICES[id];
  const Icon = s.icon;
  return (
    // Namespaced. The pillar sections take their id from the pillar name, and
    // one of them is "Managed" — which collided with the "managed" service key
    // here, putting two id="managed" nodes in the document. Invalid HTML, and
    // it made the hero's #managed jump link ambiguous: the browser picks the
    // first match, which was not necessarily the one intended.
    <div id={`service-${id}`} className="scroll-mt-28 border-t border-black/[0.08] py-7 first:border-t-0 first:pt-0">
      <a href={`/solutions/${id}`} className="group flex items-center gap-3">
        <span className="flex-none text-[var(--hz-cobalt)]">
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </span>
        <h3 className="hz-display text-[1.25rem] text-[var(--hz-text)] transition-colors group-hover:text-[var(--hz-cobalt)]">{s.title}</h3>
      </a>
      <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--hz-text-mute)]">{s.desc}</p>
      <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {s.capabilities.map((c) => (
          <li key={c} className="flex items-start gap-2.5 text-[13px] text-[var(--hz-text)]">
            <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-[var(--hz-cobalt)]" />
            {c}
          </li>
        ))}
      </ul>
      <a href={`/solutions/${id}`} className="group mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--hz-cobalt)] hover:opacity-80">
        Explore {s.title}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
      </a>
    </div>
  );
}

export default function ServicesPage({ content = {} }: { content?: Record<string, string> }) {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      {/* Hero — the landing page's structure, not a headline over a darkened
          photograph. The four practice jump-links stay, since on a page this
          long they are navigation rather than decoration. */}
      <PageHero
        eyebrow="Our solutions"
        title={content.servicesTitle || "Talent, engineering, technology, and managed services."}
        subtitle={
          content.servicesSubtitle ||
          "From specialized staffing and engineering talent to enterprise-grade technology and managed services, four connected practices, one accountable team. Serving enterprises and state government agencies across North America."
        }
        note="Trusted by Fortune 500 enterprises and state government agencies, from large-scale IT modernization programs to mission-critical managed operations."
        image={IMG.servicesHero}
        actions={
          <>
            <Cta href="/contact" variant="primary">Start a conversation</Cta>
            {pillars.map((p) => (
              <a
                key={p.name}
                href={`#${p.name.toLowerCase()}`}
                className="inline-flex items-center rounded-full border border-[var(--hz-text)]/25 px-6 py-3 text-[14px] font-semibold text-[var(--hz-text)] transition-colors hover:border-[var(--hz-text)]"
              >
                {p.name}
              </a>
            ))}
          </>
        }
      />

      {/* Service lines, image-led, alternating */}
      {pillars.map((p, i) => {
        const reversed = i % 2 === 1;
        return (
          <section
            key={p.name}
            id={p.name.toLowerCase()}
            className={`relative w-full scroll-mt-24 py-24 sm:py-28 ${i % 2 === 1 ? "bg-[var(--hz-surface-2)]" : "bg-[var(--hz-canvas)]"}`}
          >
            <div className="mx-auto grid max-w-7xl items-start gap-12 px-6 sm:px-8 lg:grid-cols-2 lg:gap-16">
              {/* Image */}
              <Reveal className={`lg:sticky lg:top-28 ${reversed ? "lg:order-2" : ""}`}>
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl">
                  <Photo src={p.img} alt={`${p.name} services`} />
                  <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 45%, rgba(5,12,28,0.78) 100%)" }} />
                  <div className="absolute inset-x-7 bottom-7">
                    <span className="hz-eyebrow text-[var(--hz-cyan-400)]">{p.tag}</span>
                    <p className="hz-display mt-2 text-[2rem] sm:text-[2.4rem] leading-none text-white">{p.name}</p>
                  </div>
                  <span className="absolute left-6 top-6 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-[13px] font-semibold text-white backdrop-blur-sm">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
              </Reveal>

              {/* Detail */}
              <Reveal delay={0.08} className={reversed ? "lg:order-1" : ""}>
                <Eyebrow>{p.name}</Eyebrow>
                <p className="mt-5 max-w-md text-[16px] leading-relaxed text-[var(--hz-text-mute)]">{p.desc}</p>
                {p.href ? (
                  <div className="mt-8">
                    {p.points && (
                      <ul className="space-y-2.5">
                        {p.points.map((pt) => (
                          <li key={pt} className="flex items-start gap-2.5 text-[14px] text-[var(--hz-text)]">
                            <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-[var(--hz-cobalt)]" />
                            {pt}
                          </li>
                        ))}
                      </ul>
                    )}
                    <a href={p.href} className="group mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--hz-cobalt)] hover:opacity-80">
                      Explore {p.name}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                    </a>
                  </div>
                ) : (
                  <div className="mt-8">
                    {p.ids?.map((id) => (
                      <ServiceDetail key={id} id={id} />
                    ))}
                  </div>
                )}
              </Reveal>
            </div>
          </section>
        );
      })}

      {/* Process */}
      <section className="relative w-full bg-[var(--hz-surface-2)] py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <Eyebrow>How we work</Eyebrow>
            <h2 className="hz-display mt-6 text-[clamp(1.75rem,3.6vw,3rem)] text-[var(--hz-text)]">A method you can hold us to.</h2>
          </Reveal>
          <Stagger className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4" gap={0.1}>
            {steps.map((st) => {
              const Icon = st.icon;
              return (
                <StaggerItem key={st.no} className="h-full">
                  <div className="hz-card h-full p-7">
                    <div className="flex items-center justify-between">
                      <div className="text-[var(--hz-cobalt)]">
                        <Icon className="h-6 w-6" strokeWidth={1.5} />
                      </div>
                      <span className="hz-display text-[1.5rem] text-black/10">{st.no}</span>
                    </div>
                    <h3 className="hz-display mt-6 text-[1.3rem] text-[var(--hz-text)]">{st.title}</h3>
                    <p className="mt-3 text-[14px] leading-relaxed text-[var(--hz-text-mute)]">{st.desc}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate w-full overflow-hidden bg-[var(--hz-ink)]">
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center sm:px-8 sm:py-28 lg:py-32">
          <Reveal className="flex flex-col items-center">
            <Eyebrow tone="dark">Let&apos;s talk</Eyebrow>
            <h2 className="hz-display mt-7 max-w-[16ch] text-[clamp(1.9rem,4.6vw,3rem)] text-white">Tell us what you&apos;re building.</h2>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/70 sm:text-[17px]">
              We&apos;ll put the right specialists on it and stand behind the result.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Cta href="/contact" variant="primary">Book a discovery call</Cta>
              <Cta href="/about" variant="ghostDark">About Ocean Blue</Cta>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
