"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import Photo from "./Photo";
import { IMG } from "./media";

/* ============================================================
   Hero — customer.io structure, Ocean Blue content.

   What that page does, and why each part is here:

     · An enormous left-aligned statement in near-black on warm
       off-white. No photograph behind the type at all — the words
       ARE the hero, and the image sits beneath them rather than
       under them. This is the biggest single reason that page reads
       as confident: nothing competes with the sentence.
     · A two-line subhead, no more.
     · Two actions, filled and outlined, the same size. Deliberately
       not the one-CTA rule used elsewhere on this site: "talk to us"
       and "see the work" are genuinely different intents, not a
       primary action and a nav link wearing the same clothes.
     · A row of proof microcopy directly under the buttons, which is
       where objections get answered before they are raised.
     · A wide image below the statement, at container width.

   The copy is rewritten, not reused. The old hero said "The people
   and platforms behind enterprises and government agencies" —
   accurate, and equally true of two hundred other firms. This leads
   with what a buyer is actually choosing between: one accountable
   team, or a stack of vendors pointing at each other.
   ============================================================ */

const PROOF = ["Shortlists in 48 hours", "One accountable SLA", "Certified MBE / WBE"];

export default function Hero({ content = {} }: { content?: Record<string, string> }) {
  return (
    <section className="relative w-full bg-[var(--hz-paper)] pt-16 sm:pt-20 lg:pt-24">
      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
        {/* Measure is set in ch so the line count holds its shape as the clamp
            scales, rather than rewrapping differently at every width. */}
        <h1 className="hz-display max-w-[17ch] text-[clamp(2.6rem,7vw,5.75rem)] leading-[0.98] tracking-[-0.035em] text-[var(--hz-text)]">
          {content.heroTitle || "One team accountable for the whole thing."}
        </h1>

        <p className="mt-7 max-w-[46ch] text-[17px] leading-relaxed text-[var(--hz-text-mute)] sm:mt-8 sm:text-[19px]">
          {content.heroSubtitle ||
            "Staffing, engineering, platforms and round-the-clock operations from one partner, under one contract, measured against one standard."}
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3 sm:mt-10">
          <Link
            href="/contact"
            className="inline-flex items-center rounded-full bg-[var(--hz-text)] px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--hz-cobalt)]"
          >
            {content.heroCtaText || "Start a conversation"}
          </Link>
          <Link
            href="/solutions"
            className="inline-flex items-center rounded-full border border-[var(--hz-text)]/25 px-7 py-3.5 text-[15px] font-semibold text-[var(--hz-text)] transition-colors hover:border-[var(--hz-text)]"
          >
            {content.heroCtaSecondary || "See what we do"}
          </Link>
        </div>

        {/* Proof row: small, quiet, directly under the action — the same place
            customer.io answers "is this going to be a fight?" */}
        <ul className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-2.5">
          {PROOF.map((p) => (
            <li key={p} className="flex items-center gap-2 text-[13.5px] text-[var(--hz-text-mute)]">
              <Check className="h-4 w-4 flex-none text-[var(--hz-cobalt)]" strokeWidth={2.5} />
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* The image sits BELOW the statement, never behind it. */}
      <div className="mx-auto mt-14 w-full max-w-[2200px] px-6 sm:mt-16 sm:px-10 lg:px-16 2xl:px-28">
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl bg-[var(--hz-band)]">
          <Photo src={IMG.serviceTalent} sizes="(min-width: 1024px) 88vw, 92vw" />
        </div>
      </div>
    </section>
  );
}
