"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./motion/Primitives";
import Photo from "./Photo";
import { IMG } from "./media";

// Stops the browser pulling the 1600w candidate for a ~300px box.
const CARD_SIZES =
  "(min-width: 1536px) 22vw, (min-width: 1024px) 23vw, (min-width: 640px) 45vw, 92vw";

type Service = {
  name: string;
  /** The one line the card shows. */
  blurb: string;
  href: string;
  img: string;
};

const services: Service[] = [
  {
    name: "IT Staffing & Talent",
    blurb: "Vetted specialists who join your team and carry the work, not a ticket.",
    href: "/solutions/staffing",
    img: IMG.serviceTalent,
  },
  {
    name: "Engineering Talent & Services",
    blurb: "Mechanical, electrical, aerospace and controls engineers, on your program.",
    href: "/solutions/engineering",
    img: IMG.serviceEngineering,
  },
  {
    name: "Enterprise Solutions",
    blurb: "Cloud, security and production AI, shipped without stopping the business.",
    href: "/solutions/cloud",
    img: IMG.serviceSolutions,
  },
  {
    name: "Managed Services",
    blurb: "Monitoring, support and tuning around the clock. One number to call.",
    href: "/solutions/managed",
    img: IMG.serviceManaged,
  },
];

/**
 * One practice: photograph mounted on a flat dark plate carrying the name,
 * a one-liner and the arrow. The blurb and arrow share a row so the plate
 * stays the same height across cards whose copy differs in length.
 */
function ServiceCard({ s }: { s: Service }) {
  return (
    <Link
      href={s.href}
      className="hz-focus group flex h-full flex-col transition-transform duration-200 active:scale-[0.99]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--hz-plate-well)]">
        <Photo
          src={s.img}
          sizes={CARD_SIZES}
          className="transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col bg-[var(--hz-plate)] px-6 py-7 transition-colors duration-300 group-hover:bg-[var(--hz-plate-hover)] sm:px-7">
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
