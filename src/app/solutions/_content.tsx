"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Cta } from "@/components/landing/ui";
import PageHero from "@/components/landing/PageHero";
import { IMG } from "@/components/landing/media";

/* This page is an INDEX, not an essay. Someone arriving here is looking for
   the practice that matches their problem, so the page is built as a
   directory: four large numbered entries, every sub-service on the surface as
   a link, no photography between them to scroll past. */

const SERVICE_TITLES: Record<string, string> = {
  staffing: "IT Staffing & Talent",
  cloud: "Cloud Engineering",
  cybersecurity: "Cybersecurity",
  erp: "ERP Solutions",
  salesforce: "Salesforce Services",
  ai: "AI & Data Intelligence",
  managed: "Managed Services",
  transformation: "Digital Transformation",
};

type Practice = {
  no: string;
  name: string;
  desc: string;
  services: { title: string; href: string }[];
};

const practices: Practice[] = [
  {
    no: "01",
    name: "Talent",
    desc: "The specialists who join your team and own the work, on flexible or permanent terms, or as a fully managed team.",
    services: ["staffing"].map((s) => ({ title: SERVICE_TITLES[s], href: `/solutions/${s}` })),
  },
  {
    no: "02",
    name: "Engineering",
    desc: "Mechanical, electrical, structural, aerospace, controls and manufacturing engineers for the industries that build things.",
    services: [{ title: "Engineering Talent & Services", href: "/solutions/engineering" }],
  },
  {
    no: "03",
    name: "Solutions",
    desc: "Platform and product work, delivered securely and without stopping the business.",
    services: ["cloud", "cybersecurity", "erp", "salesforce", "ai", "transformation"].map((s) => ({
      title: SERVICE_TITLES[s],
      href: `/solutions/${s}`,
    })),
  },
  {
    no: "04",
    name: "Managed",
    desc: "We operate and improve your systems around the clock, on one accountable SLA.",
    services: ["managed"].map((s) => ({ title: SERVICE_TITLES[s], href: `/solutions/${s}` })),
  },
];

const steps = [
  { no: "01", title: "Discovery", desc: "We learn the business, the constraints, and the outcome that matters, before proposing anything." },
  { no: "02", title: "Strategy", desc: "We design the solution and the roadmap together, with success metrics agreed up front." },
  { no: "03", title: "Implementation", desc: "We execute in agile increments, shipping working software and integrated talent." },
  { no: "04", title: "Optimization", desc: "We monitor, review, and improve continuously against the SLA, in quarterly reviews." },
];

export default function ServicesPage({ content = {} }: { content?: Record<string, string> }) {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      <PageHero
        eyebrow="Our solutions"
        title={content.servicesTitle || "Talent, engineering, technology, and managed services."}
        subtitle={
          content.servicesSubtitle ||
          "Four connected practices under one accountable team, serving enterprises and state government agencies across North America."
        }
        image={IMG.servicesHero}
        actions={<Cta href="/contact" variant="primary">Start a conversation</Cta>}
      />

      {/* The directory. Each practice is one wide row: the number and name
          hold the left rail, the services sit in the right as a live column of
          links. The whole catalogue is visible without opening anything. */}
      <section className="w-full px-6 pt-16 sm:px-10 sm:pt-20 lg:px-16 lg:pt-24 2xl:px-24">
        <Stagger as="ol" className="border-t border-[var(--hz-line)]" gap={0.08}>
          {practices.map((p) => (
            <StaggerItem as="li" key={p.no} className="border-b border-[var(--hz-line)]">
              <div className="grid gap-6 py-10 sm:py-12 lg:grid-cols-12 lg:gap-12">
                <div className="lg:col-span-5">
                  <div className="flex items-baseline gap-5">
                    <span className="hz-display hz-tnum text-[1.1rem] leading-none text-[var(--hz-cobalt)]">
                      {p.no}
                    </span>
                    <h2 className="hz-display text-[2rem] leading-none text-[var(--hz-text)] sm:text-[2.6rem]">
                      {p.name}
                    </h2>
                  </div>
                  <p className="mt-5 max-w-[42ch] pl-0 text-[15px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[16px] lg:pl-[3.1rem]">
                    {p.desc}
                  </p>
                </div>

                {/* Two columns once a practice carries more than three
                    services, so the tall one does not stretch the row. */}
                <ul
                  className={`lg:col-span-6 lg:col-start-7 ${
                    p.services.length > 3 ? "grid gap-x-10 gap-y-1 sm:grid-cols-2" : ""
                  }`}
                >
                  {p.services.map((s) => (
                    <li key={s.href}>
                      <Link
                        href={s.href}
                        className="hz-focus group flex items-center justify-between gap-4 border-b border-[var(--hz-paper-line)] py-3 text-[15px] font-semibold text-[var(--hz-text-mute)] transition-colors hover:text-[var(--hz-cobalt)]"
                      >
                        {s.title}
                        <ArrowUpRight
                          className="h-4 w-4 flex-none text-[var(--hz-line-2)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--hz-cobalt)]"
                          strokeWidth={2}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Method, as a horizontal rail rather than another stack. */}
      <section className="w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <Reveal className="max-w-2xl">
          <h2 className="hz-display hz-h2 text-[var(--hz-text)]">A method you can hold us to.</h2>
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

      {/* Close on type, not on another photograph. */}
      <section className="w-full border-t border-[var(--hz-line)] px-6 py-20 sm:px-10 sm:py-24 lg:px-16 2xl:px-24">
        <Reveal className="max-w-3xl">
          <h2 className="hz-display max-w-[16ch] text-[clamp(2rem,5vw,3.6rem)] leading-[1.03] text-[var(--hz-text)]">
            Tell us what you are building.
          </h2>
          <p className="mt-6 max-w-[48ch] text-[17px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[18px]">
            We will put the right specialists on it and stand behind the result.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Cta href="/contact" variant="primary">Book a discovery call</Cta>
            <Cta href="/about" variant="ghostLight">About Ocean Blue</Cta>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
