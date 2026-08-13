"use client";

import { useReducedMotion } from "motion/react";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { Reveal, Stagger, StaggerItem } from "./motion/Primitives";

/**
 * The platforms delivery work is built on. A divided list rather than a card
 * grid, so this band does not repeat the shape of the Services section
 * directly above it.
 *
 * The only dark band between the hero and the closing CTA: two adjacent dark
 * sections read as one section with a line through it.
 */

type Partner = { name: string; logo: string; cls: string; work: string };

// `work` only restates capabilities already claimed on the Services cards.
// Deliberately asserts no partnership tier or certification level.
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
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate w-full overflow-hidden bg-[var(--hz-ink)] pt-16 pb-14 sm:pt-20 sm:pb-16 lg:pt-24 lg:pb-20">
      {/* Canvas-based, paints only while in view, and skipped under reduced
          motion. Kept faint so it never competes with the content over it.
          Colour is --hz-cobalt-300, the accent as it behaves on a dark
          ground, so the page stays on one hue. */}
      {!reduce && (
        <FlickeringGrid
          className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(120%_90%_at_50%_0%,black,transparent_75%)]"
          squareSize={3}
          gridGap={8}
          flickerChance={0.12}
          maxOpacity={0.16}
          color="rgb(143, 180, 253)"
        />
      )}
      <div className="relative mx-auto grid w-full max-w-[2200px] gap-12 px-6 sm:px-10 lg:grid-cols-12 lg:items-center lg:gap-16 lg:px-16 2xl:px-28">
        {/* Centred within its own column, not across the section: the partner
            list keeps the right half. */}
        <Reveal className="text-center lg:col-span-5">
          <h2 className="hz-display hz-h2 text-white">
            We build on what you already run.
          </h2>
          <p className="mx-auto mt-5 max-w-[42ch] text-[16px] leading-relaxed text-white/60 sm:text-[17px]">
            Your stack is already familiar territory. These are the platforms
            most of our delivery work is built on.
          </p>
        </Reveal>

        <Stagger
          as="ul"
          className="divide-y divide-white/10 lg:col-span-6 lg:col-start-7"
          gap={0.1}
        >
          {partners.map((p) => (
            <StaggerItem as="li" key={p.name}>
              <div className="grid grid-cols-[minmax(0,7rem)_1fr] items-center gap-6 py-7 sm:grid-cols-[minmax(0,9rem)_1fr] sm:gap-8 sm:py-8">
                {/* Fixed cell so marks of differing proportions share one
                    left edge and one baseline. */}
                <div className="flex h-12 items-center sm:h-14">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.logo}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    decoding="async"
                    className={`${p.cls} max-w-full w-auto object-contain`}
                  />
                </div>

                <div>
                  {/* Snowflake and Databricks ship symbol-only marks, so the
                      name is set in type. The <img> is aria-hidden because
                      this text is the accessible name. */}
                  <p className="hz-display text-[1.05rem] text-white">{p.name}</p>
                  <p className="mt-1.5 max-w-[46ch] text-[14.5px] leading-relaxed text-white/60 sm:text-[15px]">
                    {p.work}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
