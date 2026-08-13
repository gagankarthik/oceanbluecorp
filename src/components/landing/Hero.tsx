"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import WordsRise from "./motion/WordsRise";
import { Cta } from "./ui";
import VideoBackdrop from "./VideoBackdrop";

/** Split into `title` + `accent` so the colour break lands at a chosen point
 *  in the sentence rather than wherever the line happens to wrap. */
const HERO = {
  title: "The people and platforms behind",
  accent: " enterprises and government agencies.",
  sub: "IT staffing, enterprise solutions, and managed services delivered by one accountable partner, one accountable standard.",
};


export default function Hero({ content = {} }: { content?: Record<string, string> }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section
      ref={ref}
      // svh, not vh: vh causes the mobile-Safari address-bar jump.
      className="relative isolate flex min-h-[90svh] w-full flex-col overflow-hidden sm:min-h-[100svh]"
      style={{ background: "#07142b" }}
    >
      {/* hero.mp4 is a web encode of "Hero Video.mp4" (1600x900, 30fps, no
          audio, 666KB against the source's 10.5MB). Serve the encode, never
          the master: at 10MB the dev server answered the media element's range
          requests with a repeating 503 and no frame ever decoded. */}
      <VideoBackdrop
        src="/video/hero.mp4"
        poster="/video/hero-poster.jpg"
        className="z-0"
        intensity={100}
      />

      {/* Scrim, in two parts that do different jobs.

          The flat wash stays light (0.14 through the middle) so the film keeps
          its own colour rather than reading as a navy rectangle. Contrast is
          bought back by the radial alone, which sits only behind the words.

          Measured against this footage over seven frames of the loop: the
          brightest pixel behind the headline composites to 6.9:1 against
          white, worst case, over a 4.5:1 floor for the subhead. This film is
          a pale building, and at the radial's previous 0.50 it measured 4.73:1,
          which passed on paper and looked washed out. Re-measure whenever the
          film changes; a light wash leaves little room. */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(4,10,24,0.58) 0%, rgba(4,10,24,0.14) 26%, rgba(4,10,24,0.14) 66%, rgba(4,10,24,0.74) 100%), radial-gradient(62% 52% at 50% 44%, rgba(4,10,24,0.62) 0%, transparent 76%)",
        }}
      />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 flex flex-1 items-center"
      >
        <div className="hz-cinema mx-auto w-full max-w-[2200px] px-6 pt-20 pb-10 text-center sm:px-10 sm:pt-24 lg:px-16 2xl:px-28">
          {/* Entry animation is CSS, not framer-motion (see WordsRise): the
              motion version kept this copy invisible until hydration, costing
              5-8s of LCP. */}
          <div>
            {/* 34ch keeps the headline to two lines on desktop. */}
            <h1 className="hz-display mx-auto max-w-[34ch] text-[clamp(1.9rem,4.3vw,3.35rem)] tracking-[-0.03em] break-words text-white">
              <WordsRise
                text={content.heroTitle || HERO.title}
                delay={0.18}
                step={0.09}
              />{" "}
              {/* CMS-set titles render plain: an editor writing one line has
                  no way to say where the accent should start. */}
              {!content.heroTitle && (
                <span className="text-[var(--hz-cobalt-300)]">
                  <WordsRise text={HERO.accent} delay={0.52} step={0.09} />
                </span>
              )}
            </h1>

            <p
              className="hz-enter mx-auto mt-7 max-w-xl text-[16px] leading-relaxed text-white/85 sm:mt-8 sm:text-[18px] lg:text-[19px]"
              style={{ animationDelay: "1.05s" }}
            >
              {content.heroSubtitle || HERO.sub}
            </p>
          </div>

          <div
            className="hz-enter mt-9 flex justify-center sm:mt-11"
            style={{ animationDelay: "1.35s" }}
          >
            <Cta href="/contact" variant="primary" icon={ArrowRight}>{content.heroCtaText || "Start a conversation"}</Cta>
          </div>
        </div>
      </motion.div>

    </section>
  );
}
