"use client";

import { Reveal } from "./motion/Primitives";

/* ============================================================
   Statement — the thesis, with the load-bearing words in colour.

   customer.io's signature move: one long centred sentence at
   heading scale, with individual words tinted so the sentence
   carries its own emphasis map. It works because the colour is
   doing SEMANTIC work — it marks the nouns the whole argument
   rests on, so you can read the sentence in one pass or read only
   the coloured words and still get the point.

   Theirs uses five hues, which suits a product with five modules.
   Ocean Blue has one brand gradient, so the emphasis runs along it:
   the deep logo blue for the practices, the light end for the
   promise. Two tones of one hue, not five colours.

   Beneath it, three columns divided by hairlines — the same
   structure customer.io uses to land the three things that make
   the claim credible.
   ============================================================ */

const PILLARS = [
  {
    title: "One contract, not four",
    body: "Staffing, engineering, platforms and support under a single agreement and a single SLA.",
  },
  {
    title: "Our people, our problem",
    body: "Engineers are embedded and accountable to the outcome, not billed by the ticket.",
  },
  {
    title: "Public sector ready",
    body: "Certified MBE and WBE, with the procurement history state agencies ask for.",
  },
];

export default function Statement() {
  return (
    <section className="relative w-full bg-[var(--hz-paper)] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
        <Reveal>
          <p className="mx-auto max-w-[24ch] text-center text-[clamp(1.6rem,3.6vw,3rem)] font-semibold leading-[1.15] tracking-[-0.025em] text-[var(--hz-text)] sm:max-w-[30ch]">
            We put <span className="text-[var(--hz-cobalt)]">talent</span>,{" "}
            <span className="text-[var(--hz-cobalt)]">engineering</span> and{" "}
            <span className="text-[var(--hz-cobalt)]">operations</span> under one
            accountable team, so the <span className="text-[var(--hz-aqua)]">handoffs</span>{" "}
            between hiring, building and running stop being{" "}
            <span className="text-[var(--hz-aqua)]">your problem</span>.
          </p>
        </Reveal>

        {/* Three columns, hairline-divided. `divide-x` rather than a border per
            cell so the outer edges stay open and only the gaps between are
            drawn. */}
        <div className="mt-14 grid gap-10 border-t border-[var(--hz-paper-line)] pt-10 sm:mt-16 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[var(--hz-paper-line)]">
          {PILLARS.map((p) => (
            <div key={p.title} className="sm:px-8 sm:first:pl-0 sm:last:pr-0">
              <h3 className="text-[16px] font-semibold text-[var(--hz-text)]">{p.title}</h3>
              <p className="mt-2.5 max-w-[34ch] text-[14.5px] leading-relaxed text-[var(--hz-text-mute)]">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
