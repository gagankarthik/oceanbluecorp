"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "motion/react";
import Photo from "./Photo";
import { Reveal } from "./motion/Primitives";
import { IconArrowRight } from "@/components/site/icons";
import { CONTAINER, SECTION_Y } from "@/components/site/sections";

/* Two devices the interior pages are built from, in the site system.

   SplitBand: a photograph in a rounded frame beside the copy, inside the
   page container, alternating sides down a page.

   ArrowRows: a hairline-divided list where each row is a real destination.
   Every row links; a row with nowhere to go does not belong in this list. */

/** The band photograph, drifting slightly against the scroll. Transform only;
 *  a correctly framed still under reduced motion. */
function ParallaxPhoto({ image, alt }: { image: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const raw = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const y = useSpring(raw, { stiffness: 90, damping: 30, mass: 0.35 });

  if (reduce) {
    return (
      <div ref={ref} className="absolute inset-0">
        <Photo src={image} alt={alt} sizes="(min-width: 1024px) 600px, 100vw" />
      </div>
    );
  }
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.div style={{ y, willChange: "transform" }} className="absolute inset-x-0 -top-[5%] h-[110%]">
        <Photo src={image} alt={alt} sizes="(min-width: 1024px) 600px, 100vw" />
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
  /** Which side the photograph sits on. Alternate down a page. */
  side?: "left" | "right";
  /** Set under the photograph as a quiet caption. */
  caption?: string;
  children: ReactNode;
}) {
  return (
    <section data-tone="white" className={`bg-white ${SECTION_Y}`}>
      <div className={`${CONTAINER} grid items-center gap-10 lg:grid-cols-2 lg:gap-16`}>
        <figure className={side === "right" ? "lg:order-2" : ""}>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-paper-deep">
            <ParallaxPhoto image={image} alt={alt} />
          </div>
          {caption && <figcaption className="mt-3 text-[14px] leading-relaxed text-ink-subtle">{caption}</figcaption>}
        </figure>
        <Reveal className={`w-full ${side === "right" ? "lg:order-1" : ""}`}>{children}</Reveal>
      </div>
    </section>
  );
}

export type ArrowRow = { title: string; href: string };

export function ArrowRows({ rows, className = "" }: { rows: ArrowRow[]; className?: string }) {
  return (
    <ul className={`divide-y divide-line border-y border-line ${className}`}>
      {rows.map((r) => (
        <li key={r.href + r.title}>
          <Link href={r.href} className="group flex items-center justify-between gap-6 py-5">
            <span className="max-w-[46ch] text-[16px] leading-snug font-semibold text-ink transition-colors group-hover:text-cobalt">{r.title}</span>
            <IconArrowRight size={18} className="flex-none text-ink-subtle transition-all duration-200 group-hover:translate-x-1 group-hover:text-cobalt" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Section heading at the site's h2 scale. */
export function AccentHeading({ children }: { children: ReactNode }) {
  return <h2 className="type-headline text-ink">{children}</h2>;
}
