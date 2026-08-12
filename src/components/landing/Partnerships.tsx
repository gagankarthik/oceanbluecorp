"use client";

import { Reveal, Stagger, StaggerItem } from "./motion/Primitives";

/* ============================================================
   Partnerships.

   These three marks previously sat ~20px tall in the corner of the
   hero, below the fold of attention, which is where a competitor
   like TEKsystems puts a full section. The platforms a services
   firm builds on are a buying signal: an enterprise choosing a
   partner wants to know their existing stack is already familiar
   territory.

   Deliberately NOT another centred logo row. Each mark carries the
   work it stands for, which is information a bare strip cannot give.

   Dark ground, and the ONLY dark band between the hero and the closing
   careers panel. The page alternates deliberately:

     hero      dark gradient   opening anchor
     services  canvas          light
     partners  ink             the one dark beat in the middle
     clients   canvas          light
     feedback  band tint       a half-step, not a full flip
     careers   black           closing anchor

   Two darks next to each other read as one section with a line in it,
   and three read as half the page being unlit. One is a punctuation
   mark; more than one is a mood.
   ============================================================ */

type Partner = { name: string; logo: string; cls: string; work: string };

// `work` describes capabilities already claimed on the Services cards.
// Nothing here asserts a partnership tier or certification level — those
// are factual claims about the business and belong to whoever can verify
// them, not to a layout.
const partners: Partner[] = [
  {
    name: "AWS",
    logo: "/logos/partners/aws-partner-trimmed.png",
    cls: "h-12 sm:h-14",
    work: "Cloud migration, security, and the managed infrastructure we run around the clock.",
  },
  {
    name: "Snowflake",
    logo: "/logos/partners/snowflake.svg",
    cls: "h-9 sm:h-10",
    work: "Warehousing and analytics, the reporting layer the rest of the data work feeds.",
  },
  {
    name: "Databricks",
    logo: "/logos/partners/databricks.svg",
    cls: "h-9 sm:h-10",
    work: "Lakehouse and ML pipelines behind the AI and data intelligence work.",
  },
];

export default function Partnerships() {
  return (
    <section className="relative w-full bg-[var(--hz-ink)] pt-16 pb-14 sm:pt-20 sm:pb-16 lg:pt-24 lg:pb-20">
      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
        <Reveal className="max-w-2xl">
          <span className="hz-eyebrow text-white/55">Technology partners</span>
          <h2 className="hz-display hz-h2 mt-4 text-white">
            Built on the platforms you already run.
          </h2>
        </Reveal>

        <Stagger className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-3" gap={0.1}>
          {partners.map((p) => (
            <StaggerItem key={p.name} className="h-full">
              {/* A card now, not a hairline column. The cobalt cap is the one
                  piece of accent per card and it does structural work: three
                  white panels on a tinted ground need something to say where
                  each one starts, and a 3px rule does it without a border box
                  around the whole thing. */}
              <div className="flex h-full flex-col rounded-2xl bg-white/[0.05] p-7 ring-1 ring-white/10 transition-colors duration-300 hover:bg-white/[0.08] sm:p-8">
                <span aria-hidden className="block h-[3px] w-10 rounded-full bg-[var(--hz-cobalt-300)]" />

                {/* Fixed row so three marks of different proportions share one
                    baseline instead of shifting the copy below them. */}
                <div className="mt-7 flex h-14 items-center sm:h-16">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.logo}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    decoding="async"
                    className={`${p.cls} w-auto object-contain`}
                  />
                </div>

                {/* The name is set in type, not left to the artwork: Snowflake
                    and Databricks ship symbol-only marks, so without this they
                    read as abstract shapes. The <img> is aria-hidden because
                    this text is the accessible name. */}
                <p className="hz-display mt-5 text-[1.05rem] text-white">{p.name}</p>
                <p className="mt-2 text-[14.5px] leading-relaxed text-white/65 sm:text-[15px]">
                  {p.work}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
