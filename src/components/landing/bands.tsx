"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "motion/react";
import Photo from "./Photo";
import { Reveal } from "./motion/Primitives";

/* The two devices the marketing pages are built from.

   SplitBand: a photograph run hard against one screen edge with the copy in
   the opposite half. No container, no gutter, no radius, the image touching
   the viewport edge is the whole effect.

   ArrowRows: a hairline-divided list where each row is a real destination.
   Every row links; a row with nowhere to go does not belong in this list. */

/**
 * The band photograph, drifting against the scroll.
 *
 * The image is over-sized 12% and translated across a ±6% range, so the frame
 * never runs out of picture at either end of the band's travel. Spring-damped
 * so it trails the scroll slightly rather than tracking it rigidly, which is
 * what makes it read as depth instead of as a moving element.
 *
 * Transform only, and skipped entirely under reduced motion, where it must
 * still be a correctly framed photograph rather than an off-centre crop.
 */
function ParallaxPhoto({ image, alt }: { image: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const raw = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const y = useSpring(raw, { stiffness: 90, damping: 30, mass: 0.35 });

  if (reduce) {
    return (
      <div ref={ref} className="absolute inset-0">
        <Photo src={image} alt={alt} sizes="(min-width: 1024px) 50vw, 100vw" />
      </div>
    );
  }

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.div
        style={{ y, willChange: "transform" }}
        className="absolute inset-x-0 -top-[6%] h-[112%]"
      >
        <Photo src={image} alt={alt} sizes="(min-width: 1024px) 50vw, 100vw" />
      </motion.div>
    </div>
  );
}

export function SplitBand({
  image,
  alt,
  side = "left",
  caption,
  children,
}: {
  image: string;
  alt: string;
  /** Which screen edge the photograph runs to. Alternate down a page. */
  side?: "left" | "right";
  /** Laid over the foot of the image, inside its own gradient. */
  caption?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid w-full lg:grid-cols-2">
      <div
        className={`relative min-h-[300px] w-full sm:min-h-[380px] lg:min-h-[560px] ${
          side === "right" ? "lg:order-2" : ""
        }`}
      >
        <ParallaxPhoto image={image} alt={alt} />
        {caption && (
          <>
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgba(4,10,24,0.85)] to-transparent"
            />
            <p className="absolute inset-x-0 bottom-0 px-6 pb-7 text-[16px] leading-snug text-white sm:px-10 sm:pb-9 sm:text-[18px]">
              {caption}
            </p>
          </>
        )}
      </div>

      <div
        className={`flex items-center px-6 py-14 sm:px-10 sm:py-16 lg:px-16 lg:py-20 2xl:px-24 ${
          side === "right" ? "lg:order-1" : ""
        }`}
      >
        <Reveal className="w-full">{children}</Reveal>
      </div>
    </section>
  );
}

export type ArrowRow = { title: string; href: string };

export function ArrowRows({ rows, className = "" }: { rows: ArrowRow[]; className?: string }) {
  return (
    <ul className={`divide-y divide-[var(--hz-line)] border-t border-[var(--hz-line)] ${className}`}>
      {rows.map((r) => (
        <li key={r.href + r.title}>
          <Link
            href={r.href}
            className="hz-focus group flex items-center justify-between gap-6 py-5"
          >
            <span className="max-w-[46ch] text-[15px] font-semibold leading-snug text-[var(--hz-text)] transition-colors group-hover:text-[var(--hz-cobalt)] sm:text-[16px]">
              {r.title}
            </span>
            <ArrowRight
              className="h-5 w-5 flex-none text-[var(--hz-text-subtle)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:text-[var(--hz-cobalt)]"
              strokeWidth={2}
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Section heading in the accent, the reference's own opening move. */
export function AccentHeading({ children }: { children: ReactNode }) {
  return <h2 className="hz-display hz-h2 text-[var(--hz-cobalt)]">{children}</h2>;
}
