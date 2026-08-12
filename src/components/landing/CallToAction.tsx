"use client";

import { ArrowRight } from "lucide-react";
import { Reveal } from "./motion/Primitives";
import Link from "next/link";
import Photo from "./Photo";
import { IMG } from "./media";

// One wide photograph, not two marqueeing columns. Six tiles looping in
// opposite directions was a lot of motion to put beside a careers invitation,
// and it fetched six images to say what one says.
const CTA_SIZES = "(min-width: 1024px) 46vw, 92vw";

export default function CallToAction({ content = {} }: { content?: Record<string, string> }) {
  return (
    <section className="relative isolate w-full overflow-hidden bg-black">
      {/* No shader here. It was tried and removed: `envPreset="city"` adds
          environment lighting on top of color1/2/3, so even at 45% over black
          the band came out grey with a teal cast rather than dark. The hero is
          where the gradient earns its keep; this section stays flat black so
          the photograph and the white disc are the only things in it. */}

      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28 relative z-10 grid grid-cols-1 items-center gap-10 py-20 sm:py-24 lg:grid-cols-2 lg:gap-10">
        {/* ── Left: careers ───────────────────────────────────
            The copy here is supplied by the client and is Accenture's careers
            wording. I flagged that once — it is their copyrighted text and a
            reader who knows their site will recognise it — and was asked to
            use it as given, so it stands as their decision. Replace with
            original wording when there is time to write it.
        */}
        <Reveal className="flex flex-col items-start">
          <span className="hz-eyebrow text-white/55">Careers</span>
          <h2 className="hz-display mt-4 max-w-[14ch] text-[clamp(1.9rem,4.6vw,3.75rem)] leading-[1.05] text-white">
            {content.ctaHeading || "Seize the future"}
          </h2>
          <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-white/70 sm:mt-6 sm:text-[17px]">
            {content.ctaBody ||
              "Our teams are leading change on every front. From deploying the most advanced and complex technologies for the world’s most iconic companies, to building a greener, more inclusive and healthier world for our communities."}
          </p>
          {/* Text plus a white disc, not a filled cobalt pill. On a dark band
              the pill was the loudest object in the section and pulled the eye
              before the sentence that earns the click; this reads as a line of
              type that happens to be actionable. The disc is the only white
              solid here, so it still finds the eye. */}
          <Link
            href="/careers"
            className="group mt-8 inline-flex items-center gap-4 text-[15px] font-semibold text-white sm:mt-10 sm:text-[16px]"
          >
            {content.ctaButton || "Come join us"}
            <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-white text-[var(--hz-ink)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
              <ArrowRight className="h-5 w-5" strokeWidth={2} />
            </span>
          </Link>
        </Reveal>

        {/* ── Right: the photograph, unframed ────────────────
            No ring, no radius, no gradient scrim — the earlier version had all
            three and they read as chrome around the picture rather than as the
            picture. On black an unframed image has its own edge already. */}
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Photo src={IMG.aboutTeam} sizes={CTA_SIZES} />
        </div>

      </div>
    </section>
  );
}
