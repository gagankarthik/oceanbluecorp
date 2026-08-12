"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./motion/Primitives";
import Photo from "./Photo";
import { IMG } from "./media";

// Cards render at ~1/4 of a 1280px container on desktop and full-width on
// phones. Declaring that stops the browser from pulling the 1600w candidate
// for a 300px box.
const CARD_SIZES =
  "(min-width: 1536px) 22vw, (min-width: 1024px) 23vw, (min-width: 640px) 45vw, 92vw";

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
    desc: "Pre-vetted engineers who join your team and own the work, on flexible or permanent terms, or as a fully managed team.",
    href: "/solutions/staffing",
    img: IMG.serviceTalent,
    items: ["Cloud, data & security engineers", "ERP & Salesforce specialists", "Shortlists in 48 hours"],
  },
  {
    name: "Engineering Talent & Services",
    title: "Engineers, embedded fast",
    desc: "Mechanical, electrical, structural, aerospace, controls and manufacturing engineers who join your program and own the work.",
    href: "/solutions/engineering",
    img: IMG.serviceEngineering,
    items: [
      "Automotive, MFG, aerospace, power",
      "Flexible, permanent, or managed teams",
      "Shortlists in 48 hours",
    ],
  },
  {
    name: "Enterprise Solutions",
    title: "Platforms, modernized",
    desc: "Cloud migration, security, and production AI, engineered and shipped without stopping the business.",
    href: "/solutions/cloud",
    img: IMG.serviceSolutions,
    // Condensed from seven lines to four. At seven this card ran far past its
    // three-bullet neighbours and left a large void above their bottom-aligned
    // "Learn more", so the row of four read as broken rather than dense. Every
    // capability is still named — merged, not dropped — and the full list lives
    // on /solutions/cloud, which is where the card links.
    items: [
      "Cloud migration · AWS, Azure, GCP",
      "DevOps, CI/CD & automation",
      "AI, data intelligence & cybersecurity",
      "ERP & Salesforce · SAP, Oracle, Dynamics",
    ],
  },
  {
    name: "Managed Services",
    title: "Run, 24/7",
    desc: "Monitoring, support, and continuous optimization around the clock. One team, one SLA, one number to call.",
    href: "/solutions/managed",
    img: IMG.serviceManaged,
    items: ["24/7 monitoring & response", "Helpdesk & application support", "Quarterly business reviews"],
  },
];

function ServiceCard({ s }: { s: Service }) {
  return (
    <Link href={s.href} className="group flex h-full flex-col">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[var(--hz-surface-2)]">
        <Photo
          src={s.img}
          sizes={CARD_SIZES}
          className="transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
        />
        {/* Accent rule grows on hover, the one bit of motion the card needs. */}
        <span className="absolute left-0 top-6 z-10 h-8 w-1 origin-left rounded-r bg-[var(--hz-cobalt)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-x-[2.5]" />
      </div>

      <div className="mt-5 flex flex-1 flex-col sm:mt-6">
        <span className="hz-eyebrow text-[var(--hz-amber)]">{s.name}</span>
        <h3 className="hz-display mt-3 text-[1.35rem] text-[var(--hz-text)] sm:text-[1.5rem] xl:text-[1.75rem]">
          {s.title}
        </h3>
        <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[15px]">{s.desc}</p>

        <ul className="mt-5 space-y-2">
          {s.items.map((it) => (
            <li key={it} className="flex items-start gap-2.5 text-[13.5px] text-[var(--hz-text)]">
              <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-[var(--hz-cobalt)]" />
              {it}
            </li>
          ))}
        </ul>

        <span className="mt-auto inline-flex items-center gap-2 pt-6 text-[14px] font-semibold text-[var(--hz-cobalt)] sm:pt-7">
          Learn more
          <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1" strokeWidth={1.75} />
        </span>
      </div>
    </Link>
  );
}

export default function Services() {
  return (
    <section
      id="services"
      className="relative w-full bg-[var(--hz-canvas)] py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 2xl:max-w-[96rem]">
        {/* Statement left, the case for it right. The row used to be a heading
            capped at max-w-2xl with a lone "All solutions" link justified to
            the far edge, which left roughly a third of the row empty across
            the middle. Giving the right column something to say is the
            editorial fix — and it is where the pitch belongs anyway. */}
        <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-7">
            <span className="hz-eyebrow text-[var(--hz-amber)]">What we do</span>
            <h2 className="hz-display hz-h2 mt-4 text-[var(--hz-text)]">
              One partner for talent, engineering, technology, and operations.
            </h2>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <p className="text-[15px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[15.5px]">
              Four practices, one contract, one team accountable for the
              outcome — so the handoffs between hiring, building, and running
              stop being your problem to manage.
            </p>
            <Link
              href="/solutions"
              className="group mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--hz-cobalt)]"
            >
              All solutions
              <ArrowRight
                className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1"
                strokeWidth={1.75}
              />
            </Link>
          </div>
        </Reveal>

        <Stagger className="mt-12 grid gap-x-8 gap-y-12 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4" gap={0.12}>
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
