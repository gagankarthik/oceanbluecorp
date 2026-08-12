"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import WordsRise from "./motion/WordsRise";
import { Cta } from "./ui";
import ShaderBackdrop from "./ShaderBackdrop";

/* Three statements, no photographs. The hero is the shader gradient now, so
   the rotation is purely editorial: same ground, three arguments.

   This is also why the hero got FASTER rather than slower by adopting a WebGL
   background. With no photo, the LCP element is the headline — CSS-animated,
   in the server HTML, painting on first frame. The shader arrives afterwards
   over a static gradient that is a perfectly good hero on its own.

   `title` and `accent` are split at the intended line break rather than left
   to wrapping, so a slide never breaks mid-phrase at an awkward width. */
const slides = [
  {
    title: "The people and platforms behind",
    accent: "enterprises and government agencies.",
    sub: "IT staffing, enterprise solutions, and managed services delivered by one accountable partner, one accountable standard.",
  },
  {
    title: "Specialists who join your team and",
    accent: "own the work.",
    sub: "Pre-vetted engineers on flexible, permanent, or fully managed terms, with shortlists in 48 hours.",
  },
  {
    title: "Built, migrated, and",
    accent: "run around the clock.",
    sub: "Cloud, data, and security engineering with one team, one SLA, and one number to call.",
  },
];


export default function Hero({ content = {} }: { content?: Record<string, string> }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [slide, setSlide] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-[88svh] w-full flex-col overflow-hidden sm:min-h-[92vh]"
      style={{ background: "#07142b" }}
    >
      {/* The ground. Was a three-photograph crossfade; it is the shader
          gradient now, at full strength because here it IS the hero rather
          than a tint over something else. */}
      <ShaderBackdrop className="z-0" intensity={100} />

      {/* Brand scrim */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1]"
        style={{
          // Centre-weighted now: with no photograph underneath, the scrim's
          // only job is to keep the centred headline legible wherever the
          // shader happens to be bright at that moment.
          background:
            "radial-gradient(70% 60% at 50% 45%, rgba(4,10,24,0.55) 0%, rgba(4,10,24,0.2) 55%, transparent 80%), linear-gradient(0deg, rgba(4,10,24,0.55) 0%, transparent 40%)",
        }}
      />

      {/* ── Focal block, vertically centered ──────────────── */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 flex flex-1 items-center"
      >
        <div className="hz-cinema mx-auto w-full max-w-[2200px] px-6 pt-24 pb-10 text-center sm:px-10 sm:pt-28 lg:px-16 2xl:px-28">
          {/* Centred. A left-aligned statement reads as a page heading; centred
              over a full-bleed graded photograph it reads as a title card,
              which is what the slideshow underneath wants to be.

              Everything here animates from the stylesheet, not framer-motion —
              see WordsRise: the motion version left this copy invisible until
              hydration finished, which cost the LCP five to eight seconds.

              `key` on the slide index is what makes the copy re-animate on
              every change: React tears the node down and rebuilds it, so the
              entrance runs again rather than the text swapping silently. The
              CMS title, when set, wins on the FIRST slide only — that is the
              one an editor is writing when they set a hero headline. */}
          <div key={slide}>
            <h1 className="hz-display mx-auto max-w-[22ch] text-[clamp(1.9rem,4.3vw,3.35rem)] tracking-[-0.03em] break-words text-white">
              <WordsRise
                text={(slide === 0 && content.heroTitle) || slides[slide].title}
                delay={0.18}
                step={0.09}
              />{" "}
              {/* The tail carries the accent — cobalt-300, the same accent
                  lightened for a dark ground, so the page still runs on one
                  hue. A CMS-set title is left plain: an editor writing one line
                  has no way to say where the colour should start. */}
              {!(slide === 0 && content.heroTitle) && (
                <span className="text-[var(--hz-cobalt-300)]">
                  <WordsRise text={slides[slide].accent} delay={0.52} step={0.09} />
                </span>
              )}
            </h1>

            <p
              className="hz-enter mx-auto mt-7 max-w-xl text-[16px] leading-relaxed text-white/75 sm:mt-8 sm:text-[18px] lg:text-[19px]"
              style={{ animationDelay: "1.05s" }}
            >
              {(slide === 0 && content.heroSubtitle) || slides[slide].sub}
            </p>
          </div>

          {/* One action, full stop. The secondary link is gone — the section it
              pointed at is the next thing on the page. */}
          <div
            className="hz-enter mt-9 flex justify-center sm:mt-11"
            style={{ animationDelay: "1.35s" }}
          >
            <Cta href="/contact" variant="primary" icon={ArrowRight}>{content.heroCtaText || "Start a conversation"}</Cta>
          </div>
        </div>
      </motion.div>

      {/* ── Bottom bar, slide indicators ── */}
      <div
        className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28 hz-enter relative z-10 pb-8 sm:pb-10"
        style={{ animationDelay: "0.84s" }}
      >
        <div className="flex items-center justify-center gap-5">
          {/* Slide indicators */}
          <div className="flex items-center gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.title}
                onClick={() => setSlide(idx)}
                aria-label={`Show slide ${idx + 1}`}
                aria-current={slide === idx}
                className="group flex h-10 min-w-[40px] items-center justify-center px-1.5"
              >
                <span
                  className="block h-[3px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-white"
                  // White for the active slide rather than cyan: on a graded,
                  // near-navy photograph cobalt has too little contrast to read
                  // as "selected", and cyan would reintroduce the third accent
                  // the headline just dropped.
                  style={{ width: slide === idx ? 34 : 16, background: slide === idx ? "#ffffff" : "rgba(255,255,255,0.4)" }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
