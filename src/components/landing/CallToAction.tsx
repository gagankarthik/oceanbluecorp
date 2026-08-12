"use client";

import Link from "next/link";
import { Reveal } from "./motion/Primitives";
import { TagMark, ArcSweep } from "./motifs/Motifs";
import Photo from "./Photo";
import { IMG } from "./media";

/* ============================================================
   Careers — the closing band.

   The last full section before the accreditation strip, on the ink
   ground, so the page ends on the same dark note the proof band
   struck. One statement, one paragraph, one primary action, and a
   single photograph held to a modest size on the right.

   The vertical image marquees that used to live here are gone: six
   tiles looping in opposite directions is a lot of motion to put
   beside an invitation, and it fetched six images to say what one
   says.

   The arc sweep behind it is the same motif the proof band and the
   statement use, at the same low opacity. That repetition IS the
   point — a shape language only reads as one if it turns up more
   than once.
   ============================================================ */

export default function CallToAction({ content = {} }: { content?: Record<string, string> }) {
  return (
    <section className="relative isolate w-full overflow-hidden bg-[var(--hz-ink)]">
      <ArcSweep className="pointer-events-none absolute -right-28 -top-20 h-[520px] w-[520px] -scale-x-100 text-[var(--hz-aqua)] opacity-[0.09]" />

      <div className="relative z-10 mx-auto grid w-full max-w-[2200px] grid-cols-1 items-center gap-12 px-6 py-20 sm:px-10 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:px-16 2xl:px-28">
        <Reveal className="flex flex-col items-start">
          <span className="hz-eyebrow inline-flex items-center gap-2 text-[var(--hz-aqua)]">
            <TagMark className="h-3 w-3" />
            Careers
          </span>

          <h2 className="hz-display mt-5 max-w-[16ch] text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.04] tracking-[-0.03em] text-white">
            {content.ctaHeading || "Build what the next decade runs on."}
          </h2>

          <p className="mt-6 max-w-[48ch] text-[16px] leading-relaxed text-white/65 sm:text-[17px]">
            {content.ctaBody ||
              "Our engineers sit inside the teams they support, migrating the platforms, securing the data and keeping the systems that enterprises and state agencies depend on running. If you would rather own the outcome than hand off a ticket, we should talk."}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/careers"
              className="inline-flex items-center rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-[var(--hz-ink)] transition-colors hover:bg-[var(--hz-aqua)]"
            >
              {content.ctaButton || "Come join us"}
            </Link>
            <Link
              href="/careers/search"
              className="inline-flex items-center rounded-full border border-white/25 px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:border-white"
            >
              See open positions
            </Link>
          </div>
        </Reveal>

        {/* One photograph, unframed apart from its radius. */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
          <Photo src={IMG.aboutTeam} sizes="(min-width: 1024px) 46vw, 92vw" />
        </div>
      </div>
    </section>
  );
}
