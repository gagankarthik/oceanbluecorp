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

const partners = [
  { src: "/logos/partners/AWS-Partner.png", alt: "AWS Partner", cls: "h-10 md:h-12" },
  { src: "/logos/partners/snowflake.svg", alt: "Snowflake", cls: "h-6 md:h-7" },
  { src: "/logos/partners/databricks.svg", alt: "Databricks", cls: "h-6 md:h-7" },
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
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % slides.length), 5500);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <section ref={ref} className="relative isolate flex min-h-[92vh] w-full flex-col overflow-hidden" style={{ background: "#07142b" }}>
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
            width={1600}
            height={1067}
            decoding="async"
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
            "linear-gradient(100deg, rgba(5,12,28,0.9) 0%, rgba(6,16,36,0.66) 42%, rgba(7,20,43,0.34) 76%, rgba(7,20,43,0.15) 100%), linear-gradient(0deg, rgba(5,12,28,0.72) 0%, transparent 34%)",
        }}
      />

      {/* ── Focal block — vertically centered ──────────────── */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 flex flex-1 items-center"
      >
        <div className="mx-auto w-full max-w-7xl px-6 pt-28 pb-10 sm:px-8 2xl:max-w-[96rem]">
          <h1 className="hz-display max-w-[16ch] text-[1.4rem] break-words text-white sm:text-[2.6rem] lg:text-[3.6rem] 2xl:text-[4.4rem]">
            {content.heroTitle ? (
              <WordsReveal text={content.heroTitle} delay={0.12} />
            ) : (
              <>
                <WordsReveal text="The people and platforms behind" delay={0.12} />{" "}
                <span className="text-[var(--hz-cyan-400)]">
                  <WordsReveal text="enterprises and government agencies." delay={0.6} />
                </span>
              </>
            )}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.85, ease: EASE }}
            className="mt-7 max-w-xl text-[16px] leading-relaxed text-white/75 sm:text-[19px]"
          >
            {content.heroSubtitle ||
              "IT staffing, enterprise solutions, and managed services delivered by one accountable partner, one accountable standard."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1, ease: EASE }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Cta href="/contact" variant="primary" icon={ArrowRight}>{content.heroCtaText || "Start a conversation"}</Cta>
            <Cta href="#services" variant="ghostDark">{content.heroCtaSecondary || "Explore what we do"}</Cta>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Bottom bar — partners (left) + slide indicators (right) ── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 1.15, ease: EASE }}
        className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-10 sm:px-8 2xl:max-w-[96rem]"
      >
        <div className="flex flex-col gap-6 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Technology partners */}
          <div className="flex flex-col gap-3">
            <span className="hz-eyebrow text-white/55">Technology partners</span>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              {partners.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.alt}
                  src={p.src}
                  alt={p.alt}
                  loading="lazy"
                  decoding="async"
                  className={`${p.cls} w-auto object-contain opacity-85 transition-opacity duration-300 hover:opacity-100`}
                />
              ))}
            </div>
          </div>

          {/* Slide indicators */}
          <div className="flex items-center gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.src}
                onClick={() => setSlide(idx)}
                aria-label={`Show slide ${idx + 1}`}
                className="group flex h-10 min-w-[40px] items-center justify-center px-1.5"
              >
                <span
                  className="block h-[3px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-white"
                  style={{ width: slide === idx ? 34 : 16, background: slide === idx ? "var(--hz-cyan-400)" : "rgba(255,255,255,0.45)" }}
                />
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
