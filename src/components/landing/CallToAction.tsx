"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./motion/Primitives";
import { Cta } from "./ui";
import Photo from "./Photo";
import { IMG } from "./media";

// Two columns of imagery that marquee vertically in opposite directions.
const colA = [IMG.serviceTalent, IMG.heroSlides[1], IMG.serviceSolutions];
const colB = [IMG.serviceManaged, IMG.serviceEngineering, IMG.caseStudy];

function Tile({ src }: { src: string }) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl ring-1 ring-white/10">
      <Photo src={src} />
      <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 60%, rgba(5,12,28,0.4) 100%)" }} />
    </div>
  );
}

function MarqueeColumn({ imgs, direction, duration }: { imgs: string[]; direction: "up" | "down"; duration: number }) {
  const reduce = useReducedMotion();
  // Two identical copies → a -50% travel loops seamlessly.
  const from = direction === "up" ? "0%" : "-50%";
  const to = direction === "up" ? "-50%" : "0%";
  return (
    <motion.div
      className="flex flex-1 flex-col gap-4"
      animate={reduce ? undefined : { y: [from, to] }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    >
      {[...imgs, ...imgs].map((src, i) => (
        <Tile key={i} src={src} />
      ))}
    </motion.div>
  );
}

export default function CallToAction({ content = {} }: { content?: Record<string, string> }) {
  return (
    <section className="relative isolate w-full overflow-hidden" style={{ background: "#07142b" }}>
      {/* Ambient brand glow */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(55% 70% at 12% 10%, rgba(29,78,216,0.4), transparent 60%), radial-gradient(45% 60% at 95% 90%, rgba(42,216,239,0.16), transparent 62%)",
        }}
      />

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-24 sm:px-8 sm:py-32 lg:grid-cols-2 lg:gap-16 2xl:max-w-[96rem]">
        {/* ── Left half — heading, then button below ─────────── */}
        <Reveal className="flex flex-col items-start">
          <h2 className="hz-display max-w-[15ch] text-[2.2rem] leading-[1.05] text-white sm:text-[3.25rem] 2xl:text-[3.75rem]">
            {content.ctaHeading || "Tell us what you're building. We'll put the right team on it."}
          </h2>
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-white/70 sm:text-[18px]">
            {content.ctaBody ||
              "Staffing, enterprise solutions, or managed services — start with a conversation, and we'll stand behind the result."}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Cta href="/contact" variant="primary" icon={ArrowRight}>{content.ctaButton || "Book a discovery call"}</Cta>
            <Cta href="/solutions" variant="ghostDark">Explore solutions</Cta>
          </div>
        </Reveal>

        {/* ── Right half — vertical image marquees ───────────── */}
        <div
          className="relative h-[380px] overflow-hidden sm:h-[460px] lg:h-[520px]"
          style={{
            maskImage: "linear-gradient(180deg, transparent, #000 14%, #000 86%, transparent)",
            WebkitMaskImage: "linear-gradient(180deg, transparent, #000 14%, #000 86%, transparent)",
          }}
        >
          <div className="flex gap-4">
            <MarqueeColumn imgs={colA} direction="up" duration={24} />
            <MarqueeColumn imgs={colB} direction="down" duration={28} />
          </div>
        </div>
      </div>
    </section>
  );
}
