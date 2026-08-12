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

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

/* ============================================================
   Testimonials — an editorial quote wall rather than a carousel.
   Every quote is visible and indexable at once (the carousel hid
   two-thirds of the copy behind a timer), there is no auto-
   advancing motion to fight, and three hairline cards on a band
   match the content-card rhythm used by the rest of the page.
   ============================================================ */

function QuoteCard({ t }: { t: T }) {
  return (
    <figure className="group relative flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-7 transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-[var(--hz-cobalt-100)] hover:shadow-[var(--hz-shadow-md)] sm:p-8">
      {/* Typographic quote mark, set in the display face, not an icon chip. */}
      {/* Solid rgba, not `text-[var(--hz-cobalt)]/25`: an opacity modifier on a
          CSS-var arbitrary value does not compile in this Tailwind setup. */}
      <span
        aria-hidden
        className="hz-display block select-none text-[3.25rem] leading-[0.6] text-[rgba(29,78,216,0.25)] transition-colors duration-500 group-hover:text-[rgba(29,78,216,0.45)]"
      >
        &ldquo;
      </span>

      <blockquote className="mt-5 flex-1 text-[15.5px] leading-[1.62] text-[var(--hz-text)] sm:text-[16.5px]">
        {t.quote}
      </blockquote>

      <figcaption className="mt-7 flex items-center gap-3.5 border-t border-slate-200/80 pt-5">
        <span
          className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[var(--hz-cobalt)] text-[12.5px] font-semibold tracking-wide text-white"
          style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)" }}
          aria-hidden
        >
          {initials(t.author)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14.5px] font-semibold text-[var(--hz-text)]">{t.author}</span>
          <span className="block truncate text-[13px] text-[var(--hz-text-mute)]">
            {t.role} · {t.company}
          </span>
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
          <h2 className="hz-display mt-4 text-[1.75rem] text-[var(--hz-text)] sm:text-[2.1rem] 2xl:text-[2.5rem]">
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
