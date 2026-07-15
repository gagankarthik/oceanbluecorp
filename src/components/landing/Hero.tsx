"use client";

import { useCallback, useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { WordsReveal } from "./motion/Primitives";
import { Cta } from "./ui";

const EASE = [0.22, 1, 0.36, 1] as const;

const partners = [
  { src: "/logos/partners/AWS-Partner.png", alt: "AWS Partner", cls: "h-9 md:h-10" },
  { src: "/logos/partners/snowflake.svg", alt: "Snowflake", cls: "h-5 md:h-6" },
  { src: "/logos/partners/databricks.svg", alt: "Databricks", cls: "h-5 md:h-6" },
];

type Blob = { cls: string; bg: string; anim: { x: number[]; y: number[]; scale: number[] }; dur: number };
const blobs: Blob[] = [
  {
    cls: "left-[6%] top-[8%] h-[34rem] w-[34rem]",
    bg: "radial-gradient(circle, rgba(29,78,216,0.20), transparent 68%)",
    anim: { x: [0, 70, -30, 0], y: [0, -40, 40, 0], scale: [1, 1.12, 0.95, 1] },
    dur: 22,
  },
  {
    cls: "right-[4%] top-[18%] h-[30rem] w-[30rem]",
    bg: "radial-gradient(circle, rgba(42,216,239,0.18), transparent 66%)",
    anim: { x: [0, -60, 30, 0], y: [0, 50, -30, 0], scale: [1, 0.92, 1.1, 1] },
    dur: 26,
  },
  {
    cls: "bottom-[-6%] left-1/2 h-[26rem] w-[26rem] -translate-x-1/2",
    bg: "radial-gradient(circle, rgba(217,119,6,0.12), transparent 68%)",
    anim: { x: [0, 40, -40, 0], y: [0, -30, 20, 0], scale: [1, 1.08, 0.96, 1] },
    dur: 30,
  },
];

export default function Hero({ content = {} }: { content?: Record<string, string> }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 130]);
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.94]);

  // Cursor-follow spotlight — writes CSS vars directly (no re-render).
  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, []);

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      className="relative isolate flex min-h-[90vh] w-full items-center overflow-hidden bg-[var(--hz-canvas)] pt-28 pb-24 sm:pt-32"
    >
      {/* Animated aurora blobs */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        {blobs.map((b, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full blur-[70px] ${b.cls}`}
            style={{ background: b.bg }}
            animate={reduce ? undefined : b.anim}
            transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* Faint dotted grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          backgroundImage: "radial-gradient(rgba(15,23,42,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(70% 60% at 50% 40%, #000 0%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(70% 60% at 50% 40%, #000 0%, transparent 78%)",
        }}
      />

      {/* Cursor spotlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx, 50%) var(--my, 30%), rgba(29,78,216,0.10), transparent 72%)",
        }}
      />

      {/* Content — dissolves on scroll */}
      <motion.div
        style={{ opacity: contentOpacity, y: contentY, scale: contentScale }}
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center sm:px-8"
      >
        <h1 className="hz-display text-[2.6rem] leading-[1.02] text-[var(--hz-text)] sm:text-[3.9rem] lg:text-[5rem] 2xl:text-[5.6rem]">
          {content.heroTitle ? (
            <WordsReveal text={content.heroTitle} delay={0.1} />
          ) : (
            <>
              <WordsReveal text="The people and platforms behind" delay={0.1} />{" "}
              <span className="text-[var(--hz-cobalt)]">
                <WordsReveal text="modern enterprises." delay={0.5} />
              </span>
            </>
          )}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.7, ease: EASE }}
          className="mt-7 max-w-2xl text-[16px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[18px]"
        >
          {content.heroSubtitle ||
            "IT staffing, enterprise solutions, and managed services — delivered by one accountable partner, held to one accountable standard."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85, ease: EASE }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Cta href="/contact" variant="primary" icon={ArrowRight}>
            {content.heroCtaText || "Start a conversation"}
          </Cta>
          <Cta href="#services" variant="ghostLight">
            {content.heroCtaSecondary || "Explore what we do"}
          </Cta>
        </motion.div>

        {/* Technology partners */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 1, ease: EASE }}
          className="mt-14 flex flex-col items-center gap-4"
        >
          <p className="hz-eyebrow text-[var(--hz-text-subtle)]">Technology partners</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {partners.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.alt}
                src={p.src}
                alt={p.alt}
                loading="lazy"
                decoding="async"
                className={`${p.cls} w-auto object-contain opacity-90 transition-opacity duration-300 hover:opacity-100`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
