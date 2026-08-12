"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { TagMark } from "./motifs/Motifs";
import { Reveal } from "./motion/Primitives";
import Photo from "./Photo";
import { IMG } from "./media";

/* ============================================================
   What we do — a single joined panel strip.

   customer.io runs its capabilities as one continuous dark band of
   full-bleed portrait images, butted edge to edge with no gaps, a
   label at the foot of each and a small + affordance at the top.
   It reads as one object with four faces rather than four cards on
   a page, which is exactly the claim being made here: these are not
   four vendors, they are four faces of one team.

   That is why there is no gap between the panels and no radius on
   the inner edges. A gutter would undo the entire point.

   Copy is rewritten to a plain service type and one short line. The
   previous card carried an eyebrow, a marketing title, a prose
   description AND a bulleted capability list — four levels of
   hierarchy per card, sixteen across the row.
   ============================================================ */

type Practice = { name: string; line: string; href: string; img: string };

const practices: Practice[] = [
  {
    name: "Staffing",
    line: "Pre-vetted engineers who join your team and own the work.",
    href: "/solutions/staffing",
    img: IMG.serviceTalent,
  },
  {
    name: "Engineering",
    line: "Mechanical, electrical, aerospace and controls specialists.",
    href: "/solutions/engineering",
    img: IMG.serviceEngineering,
  },
  {
    name: "Platforms",
    line: "Cloud, security and production AI, shipped without stopping the business.",
    href: "/solutions/cloud",
    img: IMG.serviceSolutions,
  },
  {
    name: "Operations",
    line: "Monitoring, support and optimisation around the clock.",
    href: "/solutions/managed",
    img: IMG.serviceManaged,
  },
];

// Each panel is a quarter of the container on desktop, full width stacked.
const PANEL_SIZES = "(min-width: 768px) 25vw, 100vw";

export default function Services() {
  return (
    <section id="services" className="relative w-full bg-[var(--hz-paper)] pb-20 sm:pb-24 lg:pb-28">
      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
        <Reveal className="max-w-3xl pb-10 sm:pb-12">
          <span className="hz-eyebrow inline-flex items-center gap-2 text-[var(--hz-cobalt)]">
            <TagMark className="h-3 w-3" />
            What we do
          </span>
          <h2 className="hz-display hz-h2 mt-4 text-[var(--hz-text)]">
            Four practices, one accountable team.
          </h2>
        </Reveal>
      </div>

      {/* Full-bleed strip: the panels run the width of the viewport, which is
          what makes them read as one band rather than a row of cards inside a
          container. */}
      <div className="grid w-full grid-cols-1 overflow-hidden md:grid-cols-4">
        {practices.map((p) => (
          <Link
            key={p.name}
            href={p.href}
            className="group relative isolate flex min-h-[440px] flex-col justify-end overflow-hidden bg-[var(--hz-ink)] p-7 sm:min-h-[520px] sm:p-8"
          >
            <Photo
              src={p.img}
              sizes={PANEL_SIZES}
              className="transition-transform duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
            />
            {/* Two scrims: a flat wash so the four panels read as one dark
                family whatever their photographs are doing, and a foot
                gradient so the label keeps contrast where the image is light.

                No negative z-index. `-z-10` was tried and put both scrims
                BEHIND the Photo — Photo is positioned with z-auto, so anything
                at -10 sits under it and the labels ended up on bare
                photography. Positioned, later in the tree, no z-index: that is
                all the ordering this needs. */}
            <span
              aria-hidden
              className="absolute inset-0 bg-[#061024]/60 transition-colors duration-500 group-hover:bg-[#061024]/48"
            />
            <span
              aria-hidden
              className="absolute inset-0"
              style={{ background: "linear-gradient(0deg, rgba(6,16,36,0.9) 0%, rgba(6,16,36,0.15) 45%, transparent 70%)" }}
            />

            <span className="absolute right-6 top-6 grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white transition-colors duration-300 group-hover:border-white group-hover:bg-white group-hover:text-[var(--hz-ink)] sm:right-7 sm:top-7">
              <Plus className="h-4 w-4" strokeWidth={2} />
            </span>

            {/* `relative` is load-bearing. Photo renders an absolutely
                positioned span, and a positioned element paints above static
                siblings regardless of DOM order — so without this the image
                covers the label completely. The + button only survived because
                it is absolute too and comes later in the tree. */}
            <div className="relative">
              <h3 className="text-[1.4rem] font-semibold tracking-[-0.015em] text-white sm:text-[1.55rem]">
                {p.name}
              </h3>
              <p className="mt-2.5 max-w-[30ch] text-[14.5px] leading-relaxed text-white/70">
                {p.line}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
