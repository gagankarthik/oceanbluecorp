"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import WordsRise from "./motion/WordsRise";
import { Cta } from "./ui";
import { IMG, srcSetFor } from "./media";

const slides = [
  { src: IMG.heroSlides[0], alt: "Enterprise technology" },
  { src: IMG.heroSlides[1], alt: "Our team at work" },
  { src: IMG.heroSlides[2], alt: "Managed infrastructure" },
];

// Sized up from h-5/h-7: at the old scale the wordmarks were ~20px tall and
// unreadable, which spent hero real estate on marks nobody could identify.
// Heights are per-logo because these lock-ups have very different aspect
// ratios — matching the raw height would make AWS's badge tower over the two
// wordmarks. These values match them optically instead.
const partners = [
  { src: "/logos/partners/AWS-Partner.png", alt: "AWS Partner", cls: "h-11 sm:h-12 md:h-14" },
  { src: "/logos/partners/snowflake.svg", alt: "Snowflake", cls: "h-7 sm:h-8 md:h-9" },
  { src: "/logos/partners/databricks.svg", alt: "Databricks", cls: "h-7 sm:h-8 md:h-9" },
];

export default function Hero({ content = {} }: { content?: Record<string, string> }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [slide, setSlide] = useState(0);
  // Slides 2+ are withheld from the DOM until the browser is idle. They sit in
  // the viewport, so `loading="lazy"` would be ignored and all three would race
  // the LCP image for bandwidth on first paint.
  const [secondaryReady, setSecondaryReady] = useState(false);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.14]);
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  useEffect(() => {
    // requestIdleCallback is still unimplemented in Safari <17, so read it off
    // window rather than relying on the lib.dom declaration.
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    });
    const load = () => setSecondaryReady(true);
    const usingIdle = typeof ric.requestIdleCallback === "function";
    const id = usingIdle
      ? ric.requestIdleCallback!(load, { timeout: 2500 })
      : window.setTimeout(load, 1200);
    return () => {
      if (usingIdle) ric.cancelIdleCallback?.(id);
      else window.clearTimeout(id);
    };
  }, []);

  // Only start rotating once the other slides have actually been fetched.
  useEffect(() => {
    if (reduce || !secondaryReady) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [reduce, secondaryReady]);

  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-[88svh] w-full flex-col overflow-hidden sm:min-h-[92vh]"
      style={{ background: "#07142b" }}
    >
      {/* Living mesh, sits behind the photos; shows through when no image is set */}
      <div
        aria-hidden
        className="hz-aurora absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(52% 56% at 80% 32%, rgba(42,216,239,0.30) 0%, transparent 60%), radial-gradient(58% 62% at 16% 82%, rgba(29,78,216,0.45) 0%, transparent 62%), radial-gradient(42% 46% at 58% 4%, rgba(99,102,241,0.24) 0%, transparent 60%)",
        }}
      />

      {/* Full-bleed crossfade slideshow */}
      <motion.div
        aria-hidden
        style={{ scale: imgScale, y: imgY, willChange: "transform" }}
        className="absolute inset-0 z-0"
      >
        {slides.map((s, idx) => {
          // The first slide is the LCP element: eager, high priority, and the
          // only one in the DOM until the browser goes idle.
          const isLcp = idx === 0;
          if (!isLcp && !secondaryReady) return null;
          return (
            <motion.img
              key={s.src}
              src={s.src}
              srcSet={srcSetFor(s.src)}
              sizes="100vw"
              alt=""
              width={1600}
              height={1067}
              decoding={isLcp ? "sync" : "async"}
              fetchPriority={isLcp ? "high" : "low"}
              loading="eager"
              initial={isLcp ? false : { opacity: 0 }}
              animate={{ opacity: slide === idx ? 1 : 0 }}
              transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          );
        })}
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

      {/* ── Focal block, vertically centered ──────────────── */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 flex flex-1 items-center"
      >
        <div className="mx-auto w-full max-w-7xl px-6 pt-24 pb-10 sm:px-8 sm:pt-28 2xl:max-w-[96rem]">
          {/* Fluid type, scales continuously instead of jumping at breakpoints,
              so the headline never collapses to body size on small phones. */}
          {/* Everything in this block animates from the stylesheet, not from
              framer-motion. See WordsRise: the motion version left this copy
              invisible until hydration finished. */}
          <h1 className="hz-display max-w-[16ch] text-[clamp(2rem,5.4vw,4.2rem)] break-words text-white">
            {content.heroTitle ? (
              <WordsRise text={content.heroTitle} delay={0.08} />
            ) : (
              <>
                <WordsRise text="The people and platforms behind" delay={0.08} />{" "}
                <span className="text-[var(--hz-cyan-400)]">
                  <WordsRise text="enterprises and government agencies." delay={0.38} />
                </span>
              </>
            )}
          </h1>

          <p
            className="hz-enter mt-6 max-w-xl text-[16px] leading-relaxed text-white/75 sm:mt-7 sm:text-[18px] lg:text-[19px]"
            style={{ animationDelay: "0.6s" }}
          >
            {content.heroSubtitle ||
              "IT staffing, enterprise solutions, and managed services delivered by one accountable partner, one accountable standard."}
          </p>

          <div
            className="hz-enter mt-8 flex flex-col items-start gap-3 sm:mt-9 sm:flex-row sm:items-center"
            style={{ animationDelay: "0.72s" }}
          >
            <Cta href="/contact" variant="primary" icon={ArrowRight}>{content.heroCtaText || "Start a conversation"}</Cta>
            <Cta href="#services" variant="ghostDark">{content.heroCtaSecondary || "Explore what we do"}</Cta>
          </div>
        </div>
      </motion.div>

      {/* ── Bottom bar, partners (left) + slide indicators (right) ── */}
      <div
        className="hz-enter relative z-10 mx-auto w-full max-w-7xl px-6 pb-8 sm:px-8 sm:pb-10 2xl:max-w-[96rem]"
        style={{ animationDelay: "0.84s" }}
      >
        <div className="flex flex-col gap-5 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          {/* Technology partners */}
          <div className="flex flex-col gap-3">
            <span className="hz-eyebrow text-white/55">Technology partners</span>
            {/* min-h reserves the row before the logos decode, no layout shift. */}
            <div className="flex min-h-[48px] flex-wrap items-center gap-x-7 gap-y-3 sm:gap-x-9 md:min-h-[56px]">
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
                // Force the deferred slides in if a visitor taps before idle fires.
                onClick={() => { setSecondaryReady(true); setSlide(idx); }}
                aria-label={`Show slide ${idx + 1}`}
                aria-current={slide === idx}
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
      </div>
    </section>
  );
}
