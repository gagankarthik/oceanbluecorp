"use client";

import { ArrowRight } from "lucide-react";
import { Reveal } from "./motion/Primitives";
import Link from "next/link";
import Photo from "./Photo";
import { IMG } from "./media";

const CTA_SIZES = "(min-width: 1024px) 46vw, 92vw";

export default function CallToAction({ content = {} }: { content?: Record<string, string> }) {
  return (
    // --hz-ink rather than pure black: #000 carries no hue, and every other
    // neutral on this page has a blue bias.
    <section className="relative isolate w-full overflow-hidden bg-[var(--hz-ink)]">
      {/* Wider gutters than the sections above. This band is a full-bleed
          dark rectangle with a photograph hard against one edge; at the
          page's standard padding it reads as edge-to-edge fill rather than
          a composed panel. */}
      <div className="mx-auto w-full max-w-[2200px] px-8 sm:px-16 lg:px-28 2xl:px-40 relative z-10 grid grid-cols-1 items-center gap-12 py-20 sm:py-24 lg:grid-cols-2 lg:gap-20">
        <Reveal className="flex flex-col items-start">
          <span className="hz-eyebrow text-white/55">Careers</span>
          <h2 className="hz-display mt-4 max-w-[14ch] text-[clamp(1.9rem,4.6vw,3.75rem)] leading-[1.05] text-white">
            {content.ctaHeading || "Own the work, not a ticket queue."}
          </h2>
          <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-white/70 sm:mt-6 sm:text-[17px]">
            {content.ctaBody ||
              "Our engineers are embedded with the client and accountable for the outcome, which means you carry real scope from the first week and you see what your work changed. If that is how you want to work, we are hiring."}
          </p>
          {/* Type plus a white disc rather than a filled pill: on a dark band
              the pill outweighs the sentence that earns the click. */}
          <Link
            href="/careers"
            className="hz-focus-dark group mt-8 inline-flex items-center gap-4 text-[15px] font-semibold text-white transition-transform duration-200 active:scale-[0.98] sm:mt-10 sm:text-[16px]"
          >
            {content.ctaButton || "See open roles"}
            <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-white text-[var(--hz-ink)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
              <ArrowRight className="h-5 w-5" strokeWidth={2} />
            </span>
          </Link>
        </Reveal>

        {/* Unframed: on a dark ground the image already has its own edge. */}
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Photo src={IMG.aboutTeam} sizes={CTA_SIZES} />
        </div>

      </div>
    </section>
  );
}
