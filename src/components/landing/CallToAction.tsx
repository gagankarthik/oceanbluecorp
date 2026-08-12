"use client";

import Link from "next/link";
import { Reveal } from "./motion/Primitives";
import { LogoMark, CheckMark } from "./motifs/Motifs";

/* ============================================================
   Closing CTA — the reference's final band.

   Its anatomy, and why each part is here:

     · A dark band ruled into columns by vertical hairlines that
       continue the grid from the strip above, so the two read as
       one structure rather than two stacked sections.
     · The brand mark, enormous and barely lighter than the ground,
       occupying the left column. Not a photograph and not an
       illustration — the logo itself, used as architecture. It is
       the only ornament the band needs.
     · One short statement, two pill actions, and the same proof
       microcopy row the hero opened with. The page closes on the
       promise it opened with, which is what makes it feel finished
       rather than merely ended.

   There is no photograph here on purpose. Every other section on
   this page carries one; the close is the one place the brand gets
   to stand on its own.
   ============================================================ */

const PROOF = ["Shortlists in 48 hours", "One accountable SLA", "Certified MBE / WBE"];

export default function CallToAction({ content = {} }: { content?: Record<string, string> }) {
  return (
    <section className="relative isolate w-full overflow-hidden bg-[var(--hz-ink)]">
      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
        <div className="grid items-center gap-10 py-20 sm:py-24 lg:grid-cols-12 lg:gap-14 lg:divide-x lg:divide-white/[0.08]">
          {/* The mark as architecture. Sized in the hundreds of pixels and set
              barely above the ground, so it registers as a shape in the room
              rather than a logo asking to be read. */}
          <div className="hidden lg:col-span-4 lg:flex lg:items-center lg:justify-center">
            <LogoMark className="h-56 w-56 text-white opacity-[0.07] xl:h-72 xl:w-72" />
          </div>

          <Reveal className="lg:col-span-8 lg:pl-14">
            <h2 className="hz-display max-w-[18ch] text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.04] tracking-[-0.03em] text-white">
              {content.ctaHeading || "Put one team on the whole problem."}
            </h2>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full bg-[var(--hz-aqua)] px-7 py-3.5 text-[15px] font-semibold text-[var(--hz-ink)] transition-colors hover:bg-white"
              >
                {content.ctaButton || "Start a conversation"}
              </Link>
              <Link
                href="/careers"
                className="inline-flex items-center rounded-full border border-[var(--hz-aqua)] px-7 py-3.5 text-[15px] font-semibold text-[var(--hz-aqua)] transition-colors hover:bg-[var(--hz-aqua)] hover:text-[var(--hz-ink)]"
              >
                Come join us
              </Link>
            </div>

            {/* The same three lines the hero opened with. Closing on them is
                what makes the page feel like it finished an argument. */}
            <ul className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-2.5">
              {PROOF.map((p) => (
                <li key={p} className="flex items-center gap-2 text-[13.5px] text-white/55">
                  <CheckMark className="h-3.5 w-3.5 flex-none text-[var(--hz-aqua)]" />
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
