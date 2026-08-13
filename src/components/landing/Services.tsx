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
  /** One line for the card. `desc` is the long form, kept for /solutions. */
  blurb: string;
  href: string;
  img: string;
  items: string[];
};

const services: Service[] = [
  {
    name: "IT Staffing & Talent",
    title: "People who own it",
    blurb: "Vetted specialists who join your team and carry the work, not a ticket.",
    desc: "Pre-vetted engineers who join your team and own the work, on flexible or permanent terms, or as a fully managed team.",
    href: "/solutions/staffing",
    img: IMG.serviceTalent,
    items: ["Cloud, data & security engineers", "ERP & Salesforce specialists", "Shortlists in 48 hours"],
  },
  {
    name: "Engineering Talent & Services",
    title: "Engineers for the hard parts",
    blurb: "Mechanical, electrical, aerospace and controls engineers, on your program.",
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
    title: "Platforms that hold",
    blurb: "Cloud, security and production AI, shipped without stopping the business.",
    desc: "Cloud migration, security, and production AI, engineered and shipped without stopping the business.",
    href: "/solutions/cloud",
    img: IMG.serviceSolutions,
    // Condensed from seven lines to four. At seven this card ran far past its
    // three-bullet neighbours and left a large void above their bottom-aligned
    // "Learn more", so the row of four read as broken rather than dense. Every
    // capability is still named, merged, not dropped, and the full list lives
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
    title: "Someone awake at 3am",
    blurb: "Monitoring, support and tuning around the clock. One number to call.",
    desc: "Monitoring, support, and continuous optimization around the clock. One team, one SLA, one number to call.",
    href: "/solutions/managed",
    img: IMG.serviceManaged,
    items: ["24/7 monitoring & response", "Helpdesk & application support", "Quarterly business reviews"],
  },
];

/**
 * One practice. Photograph on top, a flat panel beneath carrying the name,
 * one line, and the arrow.
 *
 * Square corners and a flat mid-grey panel, matching the reference. The
 * rounded card with a near-black fill read as a component; sharp corners and a
 * panel that is clearly lighter than the section behind it read as a plate the
 * image is mounted on, which is the whole difference between the two.
 *
 * The line and the arrow sit on ONE row rather than the arrow being parked at
 * the bottom of the card. That is what keeps the panel short and even across
 * four cards whose copy differs in length.
 */
function ServiceCard({ s }: { s: Service }) {
  return (
    <Link href={s.href} className="group flex h-full flex-col">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#141414]">
        <Photo
          src={s.img}
          sizes={CARD_SIZES}
          className="transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col bg-[#2a2a2a] px-6 py-7 transition-colors duration-300 group-hover:bg-[#333333] sm:px-7">
        <h3 className="text-[1.35rem] font-normal leading-tight tracking-[-0.01em] text-white sm:text-[1.5rem]">
          {s.name}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-5 pt-6">
          <p className="max-w-[24ch] text-[14.5px] leading-relaxed text-white/80 sm:text-[15px]">
            {s.blurb}
          </p>
          <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-[var(--hz-cobalt)] text-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
            <ArrowRight className="h-5 w-5" strokeWidth={2} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Services() {
  return (
    <section id="services" className="relative w-full bg-[var(--hz-canvas)] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
        {/* Light ground, dark cards. The section was black for one round and
            it broke the page: hero (dark) → services (black) → partnerships
            (near-black) put three dark bands in a row and then flipped hard to
            white, so the top half read as one long dark block and the bottom
            half as a different site. The reference card treatment is untouched
           , panel, square corners, inline arrow, it just sits on canvas now,
            which is also where the photographs read best.

            No eyebrow: the reference leads straight into the statement, and an
            uppercase label above a heading is another line to read before the
            one that matters. */}
        <Reveal className="max-w-4xl">
          <h2 className="hz-h2 font-normal leading-tight tracking-[-0.02em] text-[var(--hz-text)]">
            One partner for talent, engineering, technology, and operations.
          </h2>
        </Reveal>

        <Stagger className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4" gap={0.12}>
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
