"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/landing/motion/Primitives";
import { Cta } from "@/components/landing/ui";
import Photo from "@/components/landing/Photo";
import WaveField from "@/components/landing/motion/WaveField";
import Confetti from "@/components/landing/anniversary/Confetti";
import {
  BRAND_NAME,
  FOUNDED_LONG,
  FOUNDED_SHORT,
  LEGAL_NAME,
  MILESTONES,
} from "@/lib/company";
import {
  ANNIVERSARY_ARTWORK,
  ANNIVERSARY_COPY,
  ANNIVERSARY_SPAN,
  ANNIVERSARY_YEAR,
  ANNIVERSARY_YEARS,
} from "@/lib/anniversary";

/* ============================================================
   TEMPORARY — /13-years.

   Light and modern. Two earlier passes are worth recording so
   neither gets re-attempted:

   1. A print-style commemorative edition — masthead, hairline
      rules, a year-by-year record. Coherent, but cold.
   2. A dark cinematic version. Premium, but it fought the rest
      of the site and the near-white artwork sat on it like a
      cut-out.

   This keeps the second pass's structure and restraint and puts
   it back on a light ground, which is also where the artwork
   belongs — the graphic has a near-white field, so a light page
   lets it sit in the surface rather than on top of one.

   Depth on white is harder than on ink and comes from four
   things only: very low-alpha cobalt washes, hairline borders,
   soft wide shadows, and space. No icon chips, no gradient-
   filled cards, no gradient headlines.
   ============================================================ */

const EASE = [0.22, 1, 0.36, 1] as const;

const NUMBERS = [
  { value: String(ANNIVERSARY_YEARS), label: "Years delivering" },
  { value: "50+", label: "Enterprise clients" },
  { value: "98%", label: "Client retention" },
  { value: "4", label: "Global offices" },
];

const RAIL = [
  ...MILESTONES,
  {
    year: String(ANNIVERSARY_YEAR),
    title: `${ANNIVERSARY_YEARS} years on`,
    description:
      "Still one accountable partner, held to one standard of delivery — across IT staffing, enterprise solutions, and managed services.",
  },
];

/** Ambient cobalt/cyan wash. Alpha stays under 0.1: on white, a colour field
 *  that reads as "tinted" rather than "lit" makes the whole page look washed. */
function Wash({ intensity = 1 }: { intensity?: number }) {
  return (
    <div
      aria-hidden
      className="hz-aurora absolute inset-0 z-0"
      style={{
        background: `radial-gradient(48% 52% at 14% 8%, rgba(29,78,216,${0.09 * intensity}) 0%, transparent 64%), radial-gradient(44% 50% at 88% 78%, rgba(42,216,239,${0.1 * intensity}) 0%, transparent 66%), radial-gradient(38% 42% at 66% 0%, rgba(99,102,241,${0.06 * intensity}) 0%, transparent 62%)`,
      }}
    />
  );
}

/* ── Hero ───────────────────────────────────────────────────── */

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // The plate drifts up and dims as the page moves off it — enough to feel like
  // depth, not enough to notice as an effect.
  const plateY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const plateOpacity = useTransform(scrollYProgress, [0, 0.92], [1, 0.25]);

  return (
    <section
      ref={ref}
      className="relative isolate w-full overflow-hidden bg-[var(--hz-canvas)] pt-28 pb-20 sm:pt-32 sm:pb-28"
    >
      {/* Replaced a vendored WebGL ocean shader. It looked expensive and was —
          a raymarched fragment shader plus the `ogl` runtime, for a background.
          This is the same wave the rest of the site uses, drawn as four SVG
          paths, and it responds to scroll where the shader only looped. */}
      <WaveField
        intensity={0.9}
        className="top-auto bottom-0 z-0 h-[58%] [mask-image:linear-gradient(to_top,#000_0%,#000_50%,transparent_100%)]"
      />

      <Wash intensity={0.55} />
      <Confetti run />

      <div className="relative z-10 mx-auto max-w-7xl px-6 text-center sm:px-8 2xl:max-w-[96rem]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="inline-flex items-center gap-2.5 rounded-full border border-[var(--hz-line)] bg-white/80 py-2 pl-3 pr-4 shadow-[var(--hz-shadow-sm)] backdrop-blur-sm"
        >
          <span className="relative flex h-1.5 w-1.5">
            {!reduce && (
              <motion.span
                aria-hidden
                className="absolute inline-flex h-full w-full rounded-full bg-[var(--hz-cobalt)]"
                animate={{ scale: [1, 2.6, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--hz-cobalt)]" />
          </span>
          <span className="hz-eyebrow hz-tnum text-[var(--hz-text-mute)]">{ANNIVERSARY_SPAN}</span>
        </motion.div>

        <motion.h1
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.1 }}
          className="hz-display mx-auto mt-8 max-w-[18ch] text-[clamp(2.4rem,7vw,5.25rem)] leading-[1.02] text-[var(--hz-text)] sm:mt-10"
        >
          Thirteen years of{" "}
          <span className="text-[var(--hz-cobalt)]">{BRAND_NAME}</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.34, ease: EASE }}
          className="mx-auto mt-7 max-w-2xl text-[16.5px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[18.5px]"
        >
          {ANNIVERSARY_COPY.tagline} {ANNIVERSARY_COPY.thanks}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.46, ease: EASE }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Cta href="/contact" variant="primary" icon={ArrowRight}>
            Start a conversation
          </Cta>
          <Cta href="/about" variant="ghostLight">
            About {LEGAL_NAME}
          </Cta>
        </motion.div>
      </div>

      {/* ── The artwork ────────────────────────────────────────
          On white the plate needs separating from the page, which a border
          alone will not do — a hairline ring reads as a table cell. So: a soft
          cobalt bloom pooled beneath it, a wide low-opacity shadow, and a very
          light ring. The bloom is scaled on the y-axis so it sits under the
          plate like light on a surface rather than haloing it evenly. */}
      <motion.div
        style={reduce ? undefined : { y: plateY, opacity: plateOpacity }}
        className="relative z-10 mx-auto mt-16 w-full max-w-[600px] px-6 sm:mt-20 sm:px-8"
      >
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.5, ease: EASE }}
          className="relative"
        >
          <div
            aria-hidden
            className="absolute -inset-8 z-0 blur-3xl"
            style={{
              background:
                "radial-gradient(52% 42% at 50% 62%, rgba(29,78,216,0.30) 0%, rgba(42,216,239,0.16) 46%, transparent 74%)",
            }}
          />
          <div className="relative z-10 aspect-square w-full overflow-hidden rounded-[28px] bg-white ring-1 ring-[var(--hz-line)] shadow-[0_40px_90px_-32px_rgba(15,23,42,0.35)]">
            <Photo
              src={ANNIVERSARY_ARTWORK}
              alt={`${BRAND_NAME} ${ANNIVERSARY_YEARS}-year anniversary artwork — celebrating ${ANNIVERSARY_YEARS} years of innovation, trust, and excellence, ${ANNIVERSARY_SPAN}`}
              sizes="(max-width: 640px) 90vw, 600px"
              priority
              fallback="linear-gradient(150deg, #dbe6fe 0%, #f4f7fb 55%, #dbe6fe 100%)"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ── Numbers ────────────────────────────────────────────────── */

function Numbers() {
  return (
    <section className="relative w-full overflow-hidden border-y border-[var(--hz-band-line)] bg-[var(--hz-band)]">
      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 2xl:max-w-[96rem]">
        {/* Divided by hairlines rather than boxed into cards — four numbers in
            four tiles is the shape every SaaS page uses, and the numbers stop
            being the subject the moment they get borders and icons. */}
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {NUMBERS.map((n, i) => (
            <Reveal
              key={n.label}
              delay={i * 0.06}
              className={`px-2 py-10 sm:px-6 sm:py-16 ${
                i % 2 === 1 ? "border-l border-[var(--hz-band-line)]" : ""
              } ${i < 2 ? "border-b border-[var(--hz-band-line)] lg:border-b-0" : ""} ${
                i === 2 ? "lg:border-l lg:border-[var(--hz-band-line)]" : ""
              }`}
            >
              <p className="hz-display hz-tnum text-[clamp(2.4rem,6vw,4.25rem)] leading-none text-[var(--hz-text)]">
                {n.value}
              </p>
              <p className="mt-4 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[var(--hz-text-subtle)] sm:text-[12.5px]">
                {n.label}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Journey ────────────────────────────────────────────────── */

/* The journey.

   A plain vertical rail of cards was the first attempt and it was inert — six
   identical boxes and a line. This instead pins the year: one enormous numeral
   sits inside a progress ring on the left and swaps as you scroll through the
   panels on the right, so the ring fills as the story advances and the year is
   always the largest thing on screen. It also rhymes with the artwork, which is
   a number inside a ring of years.

   The ring is the desktop treatment only. Under `lg` there is no second column
   to pin it against, so each panel carries its own year inline — a sticky
   element in a single-column layout just covers the content it describes. */

const RING_R = 88;
const RING_C = 2 * Math.PI * RING_R;

function YearDial({ index, total, year }: { index: number; total: number; year: string }) {
  const progress = (index + 1) / total;

  return (
    <div className="relative grid h-[220px] w-[220px] place-items-center">
      <svg viewBox="0 0 220 220" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
        <circle cx="110" cy="110" r={RING_R} fill="none" stroke="var(--hz-line)" strokeWidth={2} />
        <motion.circle
          cx="110"
          cy="110"
          r={RING_R}
          fill="none"
          stroke="var(--hz-cobalt)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={RING_C}
          initial={false}
          animate={{ strokeDashoffset: RING_C * (1 - progress) }}
          transition={{ duration: 0.75, ease: EASE }}
        />
      </svg>

      {/* `mode="wait"` so the outgoing year clears before the next arrives —
          two enormous numerals cross-fading on top of each other is mush. */}
      <AnimatePresence mode="wait">
        <motion.span
          key={year}
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
          transition={{ duration: 0.4, ease: EASE }}
          className="hz-display hz-tnum text-[3.4rem] leading-none text-[var(--hz-text)]"
        >
          {year}
        </motion.span>
      </AnimatePresence>

      <span className="hz-eyebrow hz-tnum absolute bottom-6 text-[var(--hz-text-subtle)]">
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </div>
  );
}

function Panel({
  entry,
  index,
  isActive,
  isLast,
  onEnter,
}: {
  entry: { year: string; title: string; description: string };
  index: number;
  isActive: boolean;
  isLast: boolean;
  onEnter: (i: number) => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  // A narrow band across the middle of the viewport: exactly one panel can
  // occupy it, so the dial never flickers between two years.
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });

  useEffect(() => {
    if (inView) onEnter(index);
  }, [inView, index, onEnter]);

  return (
    <li
      ref={ref}
      className={`relative border-l-2 pl-7 transition-colors duration-500 sm:pl-10 ${
        isActive ? "border-[var(--hz-cobalt)]" : "border-[var(--hz-line)]"
      }`}
    >
      {/* Two separate concerns, so they cannot fight: framer-motion owns the
          one-time entrance, and a plain CSS transition owns the active/inactive
          dimming. Animating opacity from both at once multiplies them and the
          panel settles at the wrong value. Inactive panels sit back rather than
          vanish — the reader keeps sight of what came before and what is next. */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-12% 0px" }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        {/* The dimming is a DESKTOP affordance and is gated to `lg` for it.
            Below that the dial is hidden, and the active panel is decided by a
            narrow band across the middle of the viewport — with the taller
            mobile gaps, scroll positions exist where no panel is in that band,
            which would leave every panel on the page sitting at 50%. */}
        <div
          className={`opacity-100 transition-opacity duration-500 ease-out ${
            isActive ? "lg:opacity-100" : "lg:opacity-50"
          }`}
        >
          <span className="hz-display hz-tnum text-[1.6rem] text-[var(--hz-cobalt)] lg:hidden">
            {entry.year}
          </span>
          <h3 className="hz-display mt-2 text-[1.4rem] text-[var(--hz-text)] sm:text-[1.85rem] lg:mt-0">
            {entry.title}
          </h3>
          <p className="mt-3.5 max-w-xl text-[15px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[16px]">
            {entry.description}
          </p>
          {isLast && (
            <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--hz-cobalt-100)] px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--hz-cobalt)]">
              Today
            </span>
          )}
        </div>
      </motion.div>
    </li>
  );
}

function Journey() {
  const [active, setActive] = useState(0);
  const current = RAIL[active] ?? RAIL[0];

  return (
    <section className="relative w-full overflow-hidden bg-[var(--hz-canvas)] py-24 sm:py-32">
      <Wash intensity={0.55} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 2xl:max-w-[96rem]">
        <Reveal className="max-w-2xl">
          <span className="hz-eyebrow text-[var(--hz-text-subtle)]">The journey</span>
          <h2 className="hz-display mt-5 text-[clamp(1.85rem,4.2vw,3rem)] leading-[1.08] text-[var(--hz-text)]">
            {ANNIVERSARY_SPAN}, milestone by milestone.
          </h2>
        </Reveal>

        <div className="mt-14 lg:mt-20 lg:grid lg:grid-cols-12 lg:gap-16">
          {/* Pinned dial. `top` clears the fixed header plus breathing room. */}
          <div className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-36">
              <YearDial index={active} total={RAIL.length} year={current.year} />
            </div>
          </div>

          <ol className="flex flex-col gap-14 sm:gap-20 lg:col-span-7 lg:gap-28">
            {RAIL.map((m, i) => (
              <Panel
                key={m.year}
                entry={m}
                index={i}
                isActive={i === active}
                isLast={i === RAIL.length - 1}
                onEnter={setActive}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ── Statement ──────────────────────────────────────────────── */

function Statement() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden border-y border-[var(--hz-band-line)] bg-[var(--hz-band)] py-28 sm:py-40"
    >
      <Wash intensity={1.5} />
      <Confetti run={inView} />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center sm:px-8">
        <Reveal>
          <span className="hz-eyebrow text-[var(--hz-text-subtle)]">Thank you</span>
          {/* The one place on the page that raises its voice. */}
          <p className="hz-display mt-8 text-[clamp(1.9rem,5.4vw,4rem)] leading-[1.1] text-[var(--hz-text)]">
            To our employees, our clients, and our partners —{" "}
            <span className="text-[var(--hz-cobalt)]">
              thank you for thirteen years of trust.
            </span>
          </p>
          <p className="mx-auto mt-9 max-w-xl text-[16px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[17.5px]">
            None of it was built alone. Here is to the work still ahead.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Close ──────────────────────────────────────────────────── */

function Close() {
  return (
    <section className="relative w-full overflow-hidden bg-[var(--hz-canvas)] py-20 sm:py-24">
      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 2xl:max-w-[96rem]">
        <div className="flex flex-col gap-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="hz-display max-w-lg text-[clamp(1.5rem,3.4vw,2.4rem)] leading-[1.12] text-[var(--hz-text)]">
              The next thirteen start now.
            </p>
            <p className="hz-eyebrow mt-5 text-[var(--hz-text-subtle)]">
              {BRAND_NAME}, part of {LEGAL_NAME} · Founded {FOUNDED_SHORT} ·
              Powell, Ohio
            </p>
          </div>
          <div className="flex flex-none flex-col gap-3 sm:flex-row">
            <Cta href="/careers" variant="primary" icon={ArrowRight}>
              See open roles
            </Cta>
            <Cta href="/contact" variant="ghostLight">
              Contact us
            </Cta>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ThirteenYearsPage() {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      <Hero />
      <Numbers />
      <Journey />
      <Statement />
      <Close />
    </div>
  );
}
