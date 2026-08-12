"use client";

import { Reveal, Stagger, StaggerItem } from "./motion/Primitives";
import WaveField from "./motion/WaveField";

type T = { quote: string; author: string; role: string; company: string };

const testimonials: T[] = [
  {
    quote:
      "Ocean Blue operates as a true strategic partner. Their team brings deep expertise, a disciplined approach to execution, and a consistent commitment to quality.",
    author: "Brian K.",
    role: "Co-Founder",
    company: "Pivotpoint",
  },
  {
    quote:
      "OceanBlue's resources demonstrated high levels of skill and professionalism, delivering quality results that met our expectations and deadlines.",
    author: "Damodar Buchi Reddy",
    role: "Project Director",
    company: "Diebold Nixdorf",
  },
  {
    quote:
      "I have partnered with Ocean Blue for many years. They are trustworthy, honest, motivated, and bring a high degree of work ethic to everything they do.",
    author: "Ken H.",
    role: "Senior Account Executive",
    company: "Mapsys, Inc.",
  },
];

/* ============================================================
   Testimonials — an editorial quote wall rather than a carousel.
   Every quote is visible and indexable at once (the carousel hid
   two-thirds of the copy behind a timer) and there is no auto-
   advancing motion to fight.

   The card treatment was pulled back deliberately. It used to carry
   a rounded border, a hover lift and a shadow — interaction affordance
   on a <figure> that has nothing to click — plus a circular initials
   badge over a name/role subtitle, and an oversized " repeated three
   times across the row. Stripping all four leaves what a testimonial
   is actually made of: the words, at a size worth reading, and who
   said them.
   ============================================================ */

function QuoteCard({ t }: { t: T }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl bg-white p-8 sm:p-9">
      {/* Not .hz-display: that class carries font-weight 600, which set a
          four-line quote in semibold and made the row read as dense rather
          than quotable. Size and tracking are set here directly instead. */}
      <blockquote className="flex-1 text-[1.0625rem] leading-[1.58] tracking-[-0.011em] text-[var(--hz-text)] sm:text-[1.125rem]">
        {t.quote}
      </blockquote>

      <figcaption className="mt-8">
        {/* Short cobalt rule instead of a divider across the whole card: it
            marks where the quote ends without drawing a line the eye has to
            cross to reach the name. */}
        <span aria-hidden className="mb-5 block h-[2px] w-8 rounded-full bg-[var(--hz-cobalt)]" />
        <span className="block text-[14.5px] font-semibold text-[var(--hz-text)]">{t.author}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-[var(--hz-text-mute)]">
          {t.role} · {t.company}
        </span>
      </figcaption>
    </figure>
  );
}

export default function Testimonials() {
  return (
    <section className="relative w-full overflow-hidden bg-[var(--hz-band)] py-20 sm:py-28 lg:py-32">
      {/* Replaced a vendored WebGL "retro grid" — a receding synthwave horizon,
          which is a strong and entirely unrelated aesthetic to bring to a
          consulting testimonial wall, and cost a live GL context to say
          nothing. Same wave as every other band, quieter here because three
          quote cards already fill the section. */}
      {/* Same correction as the stats band — kept below the quote cards rather
          than running behind them. */}
      <WaveField
        intensity={0.6}
        className="top-auto bottom-0 z-0 h-[34%] [mask-image:linear-gradient(to_top,#000_0%,#000_25%,transparent_100%)]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 2xl:max-w-[96rem]">
        <Reveal className="max-w-2xl">
          <span className="hz-eyebrow text-[var(--hz-amber)]">Client feedback</span>
          <h2 className="hz-display hz-h2 mt-4 text-[var(--hz-text)]">
            The partners who know our work best.
          </h2>
        </Reveal>

        <Stagger className="mt-12 grid gap-6 sm:mt-14 md:grid-cols-2 lg:grid-cols-3" gap={0.1}>
          {testimonials.map((t, i) => (
            <StaggerItem
              key={t.author}
              // Three cards in a 2-up tablet grid would leave an orphan; the
              // last one spans the row there, then returns to 1/3 at lg.
              className={`h-full${i === testimonials.length - 1 ? " md:col-span-2 lg:col-span-1" : ""}`}
            >
              <QuoteCard t={t} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
