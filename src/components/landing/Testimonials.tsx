"use client";

import { Reveal, Stagger, StaggerItem } from "./motion/Primitives";

/**
 * Client work. Full-width rows, each leading with the client rather than the
 * praise. `metrics` is optional and empty until real client-approved figures
 * exist; a row without them degrades to name + quote + attribution rather
 * than inventing a statistic.
 */

type Metric = { value: string; label: string };
type Story = {
  company: string;
  quote: string;
  author: string;
  role: string;
  /** Client logo. Falls back to a wordmark chip when no asset exists yet. */
  logo?: string;
  /** Per-logo height, since intrinsic proportions differ. */
  logoCls?: string;
  /**
   * The artwork is near-white (supplied for dark backgrounds) and would be
   * invisible on this card, so render it solid dark. Same treatment the
   * client row uses for its one near-white wordmark.
   */
  darkenLogo?: boolean;
  /** Real, client-approved figures only. Empty until they exist. */
  metrics?: Metric[];
};

const stories: Story[] = [
  {
    company: "Pivotpoint",
    logo: "https://pivotpoint.us/wp-content/uploads/2020/08/logo-long-w-ds.png",
    logoCls: "h-8",
    darkenLogo: true,
    quote:
      "Ocean Blue operates as a true strategic partner. Their team brings deep expertise, a disciplined approach to execution, and a consistent commitment to quality.",
    author: "Brian K.",
    role: "Co-Founder",
  },
  {
    company: "Diebold Nixdorf",
    logo: "https://www.dieboldnixdorf.com/-/media/diebold/images/global/logo/dn-color-logo.svg",
    // Taller than its neighbours: this lockup stacks a mark over a wordmark,
    // so at their height it reads as half the size of a single-line logo.
    logoCls: "h-9",
    quote:
      "OceanBlue's resources demonstrated high levels of skill and professionalism, delivering quality results that met our expectations and deadlines.",
    author: "Damodar Buchi Reddy",
    role: "Project Director",
  },
  {
    company: "Mapsys, Inc.",
    logo: "https://www.mapsysinc.com/wp-content/uploads/2021/11/mapsys-logo.png",
    logoCls: "h-8",
    darkenLogo: true,
    quote:
      "I have partnered with Ocean Blue for many years. They are trustworthy, honest, motivated, and bring a high degree of work ethic to everything they do.",
    author: "Ken H.",
    role: "Senior Account Executive",
  },
];

function StoryCard({ s }: { s: Story }) {
  return (
    <article className="flex h-full flex-col rounded-2xl bg-[var(--hz-story)] p-7 sm:p-8">
      {/* Fixed row so logos of differing proportions share one baseline and
          the quotes below them start at the same height across cards. */}
      <div className="flex h-9 items-center">
        {s.logo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={s.logo}
            alt={s.company}
            loading="lazy"
            decoding="async"
            className={`${s.logoCls ?? "h-7"} w-auto max-w-[170px] object-contain object-left${
              s.darkenLogo ? " brightness-0 opacity-80" : ""
            }`}
          />
        ) : (
          <span className="inline-flex items-center rounded-md bg-[var(--hz-cobalt)] px-3.5 py-2 text-[14px] font-semibold text-white">
            {s.company}
          </span>
        )}
      </div>

      {s.metrics && s.metrics.length > 0 && (
        <div className="mt-6 flex gap-8">
          {s.metrics.map((m) => (
            <div key={m.label}>
              <p className="hz-display hz-tnum text-[2rem] leading-none text-[var(--hz-cobalt)]">
                {m.value}
              </p>
              <p className="mt-2 max-w-[16ch] text-[12.5px] leading-snug text-[var(--hz-text-mute)]">
                {m.label}
              </p>
            </div>
          ))}
        </div>
      )}

      <blockquote className="mt-6 text-[1.0625rem] leading-[1.55] tracking-[-0.01em] text-[var(--hz-text)]">
        {s.quote}
      </blockquote>

      {/* mt-auto pins attribution to the card floor, so the three names line
          up across cards whose quotes differ in length. */}
      <footer className="mt-auto flex flex-wrap items-baseline gap-x-2.5 pt-7">
        <span className="text-[14.5px] font-semibold text-[var(--hz-text)]">{s.author}</span>
        <span className="text-[13px] text-[var(--hz-text-mute)]">{s.role}</span>
      </footer>
    </article>
  );
}

export default function Testimonials() {
  return (
    <section className="relative w-full bg-[var(--hz-paper)] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
        <Reveal className="max-w-2xl">
          <h2 className="hz-display hz-h2 text-[var(--hz-text)]">
            Ask the people who have already worked with us.
          </h2>
        </Reveal>

        <Stagger
          className="mt-12 grid gap-6 sm:mt-14 md:grid-cols-2 lg:grid-cols-3"
          gap={0.1}
        >
          {stories.map((s) => (
            <StaggerItem key={s.company} className="h-full">
              <StoryCard s={s} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
