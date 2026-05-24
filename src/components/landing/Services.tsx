"use client";

import { ArrowRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./motion/Primitives";
import Photo from "./Photo";
import { IMG } from "./media";

type Service = {
  name: string;
  title: string;
  desc: string;
  href: string;
  img: string;
  items: string[];
};

const services: Service[] = [
  {
    name: "IT Staffing & Talent",
    title: "Specialists, embedded fast",
    desc: "Pre-vetted engineers who join your team and own the work — contract, contract-to-hire, direct, or fully managed.",
    href: "/services#staffing",
    img: IMG.serviceTalent,
    items: ["Cloud, data & security engineers", "ERP & Salesforce specialists", "Shortlists in 48 hours"],
  },
  {
    name: "Enterprise Solutions",
    title: "Platforms, modernized",
    desc: "Cloud migration, security, and production AI — engineered and shipped without stopping the business.",
    href: "/services#cloud",
    img: IMG.serviceSolutions,
    items: ["Cloud migration · AWS, Azure, GCP", "DevOps, CI/CD & automation", "AI & data intelligence"],
  },
  {
    name: "Managed Services",
    title: "Run, 24/7",
    desc: "Monitoring, support, and continuous optimization around the clock — one team, one SLA, one number to call.",
    href: "/services#managed",
    img: IMG.serviceManaged,
    items: ["24/7 monitoring & response", "Helpdesk & application support", "Quarterly business reviews"],
  },
];

function ServiceCard({ s }: { s: Service }) {
  return (
    <a href={s.href} className="group flex h-full flex-col">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
        <Photo src={s.img} className="transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105" />
        <span className="absolute left-0 top-6 z-10 h-8 w-1 rounded-r bg-[var(--hz-cobalt)]" />
      </div>

      <div className="mt-6 flex flex-1 flex-col">
        <span className="hz-eyebrow text-[var(--hz-cobalt)]">{s.name}</span>
        <h3 className="hz-display mt-3 text-[1.5rem] text-[var(--hz-text)] sm:text-[1.75rem]">{s.title}</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--hz-text-mute)]">{s.desc}</p>

        <ul className="mt-5 space-y-2">
          {s.items.map((it) => (
            <li key={it} className="flex items-start gap-2.5 text-[13.5px] text-[var(--hz-text)]">
              <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-[var(--hz-cobalt)]" />
              {it}
            </li>
          ))}
        </ul>

        <span className="mt-auto inline-flex items-center gap-2 pt-7 text-[14px] font-semibold text-[var(--hz-cobalt)]">
          Learn more
          <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1" strokeWidth={1.75} />
        </span>
      </div>
    </a>
  );
}

export default function Services() {
  return (
    <section id="services" className="relative w-full bg-[var(--hz-canvas)] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="hz-display text-[2.25rem] text-[var(--hz-text)] sm:text-[3rem]">
              One partner for talent, technology, and operations.
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-relaxed text-[var(--hz-text-mute)]">
            Three connected practices, one accountable team — so the people who build
            your systems are the people who keep them running.
          </p>
        </Reveal>

        <Stagger className="mt-16 grid gap-x-8 gap-y-12 md:grid-cols-3" gap={0.12}>
          {services.map((s) => (
            <StaggerItem key={s.name} className="h-full">
              <ServiceCard s={s} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
