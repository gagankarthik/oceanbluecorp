"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { WordsReveal } from "./motion/Primitives";
import { Cta } from "./ui";
import { IMG } from "./media";

const slides = [
  { src: IMG.heroSlides[0], alt: "Enterprise technology" },
  { src: IMG.heroSlides[1], alt: "Our team at work" },
  { src: IMG.heroSlides[2], alt: "Managed infrastructure" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Hero({ content = {} }: { content?: Record<string, string> }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [slide, setSlide] = useState(0);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.18]);
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % slides.length), 5500);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <section ref={ref} className="relative isolate flex min-h-[92vh] w-full items-center overflow-hidden" style={{ background: "#07142b" }}>
      {/* Living mesh — sits behind the photos; shows through when no image is set */}
      <div
        aria-hidden
        className="hz-aurora absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(52% 56% at 80% 32%, rgba(42,216,239,0.30) 0%, transparent 60%), radial-gradient(58% 62% at 16% 82%, rgba(29,78,216,0.45) 0%, transparent 62%), radial-gradient(42% 46% at 58% 4%, rgba(99,102,241,0.24) 0%, transparent 60%)",
        }}
      />

      {/* Full-bleed crossfade slideshow */}
      <motion.div aria-hidden style={{ scale: imgScale, y: imgY }} className="absolute inset-0 z-0">
        {slides.map((s, idx) => (
          <motion.img
            key={s.src}
            src={s.src}
            alt=""
            initial={false}
            animate={{ opacity: slide === idx ? 1 : 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            className="absolute inset-0 h-full w-full object-cover"
            loading={idx === 0 ? "eager" : "lazy"}
          />
        ))}
      </motion.div>

      {/* Brand scrim */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(100deg, rgba(5,12,28,0.9) 0%, rgba(6,16,36,0.66) 42%, rgba(7,20,43,0.34) 76%, rgba(7,20,43,0.15) 100%), linear-gradient(0deg, rgba(5,12,28,0.6) 0%, transparent 32%)",
        }}
      />

      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-32 pb-24 sm:px-8">
        <h1 className="hz-display max-w-[20ch] text-[2.6rem] text-white sm:text-[3.5rem] lg:text-[4.5rem]">
          {content.heroTitle ? (
            <WordsReveal text={content.heroTitle} delay={0.12} />
          ) : (
            <>
              <WordsReveal text="The people and platforms behind" delay={0.12} />{" "}
              <span className="text-[var(--hz-cyan-400)]">
                <WordsReveal text="ambitious enterprises." delay={0.6} />
              </span>
            </>
          )}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.85, ease: EASE }}
          className="mt-8 max-w-xl text-[16px] leading-relaxed text-white/75 sm:text-[18px]"
        >
          {content.heroSubtitle ||
            "IT staffing, enterprise solutions, and managed services — delivered by one accountable partner, on one SLA."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1, ease: EASE }}
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <Cta href="/contact" variant="primary" icon={ArrowRight}>{content.heroCtaText || "Start a conversation"}</Cta>
          <Cta href="#services" variant="ghostDark">{content.heroCtaSecondary || "Explore what we do"}</Cta>
        </motion.div>

        {/* Technology partners */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.15, ease: EASE }}
          className="mt-12 flex flex-col gap-4 border-t border-white/15 pt-7 sm:max-w-md"
        >
          <span className="hz-eyebrow text-white/55">Technology partners</span>
          <div className="flex flex-wrap items-center gap-x-9 gap-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/partners/AWS-Partner.png" alt="AWS Partner" className="h-16 w-auto object-contain opacity-90 transition-opacity hover:opacity-100 md:h-20" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/partners/snowflake.svg" alt="Snowflake" className="h-7 w-auto object-contain opacity-80 transition-opacity hover:opacity-100 md:h-8" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/partners/databricks.svg" alt="Databricks" className="h-7 w-auto object-contain opacity-80 transition-opacity hover:opacity-100 md:h-8" />
          </div>
        </motion.div>

        {/* Slide indicators */}
        <div className="mt-14 flex items-center gap-2">
          {slides.map((s, idx) => (
            <button
              key={s.src}
              onClick={() => setSlide(idx)}
              aria-label={`Show slide ${idx + 1}`}
              className="group py-2"
            >
              <span
                className="block h-[3px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-white"
                style={{ width: slide === idx ? 34 : 16, background: slide === idx ? "var(--hz-cyan-400)" : "rgba(255,255,255,0.45)" }}
              />
            </button>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
