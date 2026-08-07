"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarDays, TrendingUp } from "lucide-react";
import { Cta } from "../ui";
import Confetti from "./Confetti";
import YearArc from "./YearArc";
import Numeral from "./Numeral";
import { FOUNDED_SHORT } from "@/lib/company";
import {
  ANNIVERSARY_COPY,
  ANNIVERSARY_PATH,
  ANNIVERSARY_SPAN,
  ANNIVERSARY_YEARS,
} from "@/lib/anniversary";

/* ============================================================
   TEMPORARY — the 13-year celebration band.

   The FIRST section on the homepage, above the hero, because for
   the days it is up it is the news. That placement is why it
   carries its own `pt-24`: the site header is fixed and opaque,
   so the top section on any page has to clear it itself (the
   hero does the same).

   ── The opening sequence ──────────────────────────────────
   The band does not fade in like the rest of the page. It runs a
   staged unveil: a three-step loader fills, the mark irises open
   from the numeral's centre while the year ring draws and the
   count runs, the copy rises, and the burst fires last.

   It plays ONCE PER SESSION. A choreographed 2.5s open is a
   moment the first time and an obstacle the fourth, and this is
   the homepage — people come back to it within a visit. The
   `sessionStorage` flag is set before the first timer rather than
   after the last, so a visitor who navigates away mid-sequence
   still gets the instant version on return.

   Reduced motion skips the whole thing and renders the final
   state; a staged reveal with a loader is exactly what that
   preference is asking not to see.

   Delete this directory to retire the celebration — see
   `src/lib/anniversary.ts` for the full teardown list.
   ============================================================ */

const EASE = [0.22, 1, 0.36, 1] as const;

const SEEN_KEY = "ob-anniversary-intro";

/** Sequence stages, in order. DONE is the resting state and is also what a
 *  returning visitor and a reduced-motion visitor start at. */
const STEP = { PENDING: -1, LOADER: 0, MARK: 1, COPY: 2, BURST: 3, DONE: 99 } as const;

/* Loader: three segments filling at 300ms each. `MARK` therefore cannot start
   before 900ms or the last segment is cut off mid-fill. */
const SEGMENT_MS = 300;
const TIMINGS: [number, number][] = [
  [STEP.MARK, 1000],
  [STEP.COPY, 1900],
  [STEP.BURST, 2500],
];

function useIntroSequence() {
  const reduce = useReducedMotion();
  // Starts PENDING so the server's HTML and the client's first render agree —
  // sessionStorage cannot be read during render without a hydration mismatch.
  const [step, setStep] = useState<number>(STEP.PENDING);

  useEffect(() => {
    let seen = false;
    // Private-mode Safari throws on sessionStorage access rather than returning
    // null. A storage failure must not cost the visitor the section.
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      seen = false;
    }

    if (seen || reduce) {
      setStep(STEP.DONE);
      return;
    }

    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore — the sequence just replays next visit */
    }

    setStep(STEP.LOADER);
    const timers = TIMINGS.map(([to, at]) => window.setTimeout(() => setStep(to), at));
    return () => timers.forEach(window.clearTimeout);
  }, [reduce]);

  return step;
}

/* ── Step loader ────────────────────────────────────────────── */

function StepLoader() {
  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: "easeOut" } }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="relative h-[3px] w-9 overflow-hidden rounded-full bg-[var(--hz-line-2)] sm:w-11"
          >
            <motion.span
              className="absolute inset-y-0 left-0 block rounded-full bg-[var(--hz-cobalt)]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: SEGMENT_MS / 1000,
                delay: (i * SEGMENT_MS) / 1000,
                ease: "easeInOut",
              }}
            />
          </span>
        ))}
      </div>
      <motion.span
        className="hz-eyebrow text-[var(--hz-text-subtle)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        {ANNIVERSARY_SPAN}
      </motion.span>
    </motion.div>
  );
}

/* ── Chip ───────────────────────────────────────────────────── */

function Chip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="grid h-11 w-11 flex-none place-items-center rounded-full border border-[var(--hz-cobalt-100)] bg-white text-[var(--hz-cobalt)]"
      >
        <Icon className="h-5 w-5" strokeWidth={1.6} />
      </span>
      <span className="text-left">
        <span className="block text-[11.5px] uppercase tracking-[0.14em] text-[var(--hz-text-subtle)]">
          {label}
        </span>
        <span className="hz-tnum block text-[15px] font-semibold text-[var(--hz-cobalt)]">
          {value}
        </span>
      </span>
    </div>
  );
}

/* ── Section ────────────────────────────────────────────────── */

export default function Anniversary({ content = {} }: { content?: Record<string, string> }) {
  const step = useIntroSequence();
  const markRef = useRef<HTMLDivElement>(null);

  const showLoader = step === STEP.LOADER;
  const markOpen = step >= STEP.MARK;
  const copyIn = step >= STEP.COPY;
  const burst = step >= STEP.BURST;

  const heading = content.anniversaryHeading || ANNIVERSARY_COPY.heading;
  const tagline = content.anniversaryTagline || ANNIVERSARY_COPY.tagline;
  const thanks = content.anniversaryThanks || ANNIVERSARY_COPY.thanks;

  return (
    <section
      id="thirteen"
      aria-labelledby="thirteen-heading"
      className="relative w-full overflow-hidden border-b border-[var(--hz-band-line)] bg-[var(--hz-band)] pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pb-24"
    >
      {/* Wave motif from the celebration artwork — bottom corners only, very
          low contrast, purely atmospheric. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full"
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        fill="none"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={`M-40,${168 + i * 16} C 300,${96 + i * 16} 620,${150 + i * 16} 1480,${58 + i * 16}`}
            stroke="#1d4ed8"
            strokeOpacity={0.09 - i * 0.012}
            strokeWidth={1.25}
          />
        ))}
      </svg>

      <Confetti run={burst} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 2xl:max-w-[96rem]">
        {/* ── The mark ────────────────────────────────────────
            The box matches YearArc's 700×480 viewBox exactly, so the ring's
            geometry and the numeral's position live in one coordinate space and
            stay locked together at every width. The numeral centres on 62%
            rather than 50%: the ring opens downward, so its optical centre sits
            low in the box and the number has to follow it. */}
        <div ref={markRef} className="relative mx-auto aspect-[700/480] w-full max-w-[620px]">
          <AnimatePresence>{showLoader && <StepLoader />}</AnimatePresence>

          {/* Iris, opening from the numeral's centre rather than the box's, so
              the reveal and the ring share an origin. `initial={false}` keeps a
              returning visitor from playing the wipe on mount. */}
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{
              clipPath: markOpen ? "circle(80% at 50% 62%)" : "circle(0% at 50% 62%)",
            }}
            transition={{ duration: 0.95, ease: EASE }}
          >
            {/* Mounted with the reveal, not before: YearArc animates on scroll
                into view, and this section is above the fold — mounted earlier
                its 1.9s draw would run to completion behind the closed iris and
                the ring would simply be there when it opened. */}
            {markOpen && <YearArc />}
            <div className="absolute inset-x-0 top-[62%] flex -translate-y-1/2 justify-center">
              <Numeral
                value={ANNIVERSARY_YEARS}
                run={markOpen}
                className="text-[clamp(5rem,30vw,16rem)]"
              />
            </div>
          </motion.div>
        </div>

        {/* ── Copy, facts and actions ─────────────────────────
            One wrapper animating opacity/transform rather than per-block
            scroll reveals. The blocks stay mounted throughout so the section's
            height never changes — mounting them at the copy step would shift
            everything below the fold mid-sequence. */}
        <motion.div
          initial={false}
          animate={copyIn ? "show" : "hidden"}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 18 },
              show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
            }}
            className="mx-auto mt-6 max-w-3xl text-center sm:mt-8"
          >
            <h2
              id="thirteen-heading"
              className="hz-display text-[clamp(1.9rem,5vw,3.25rem)] text-[var(--hz-text)]"
            >
              {heading}
            </h2>
            <p className="mt-5 text-[clamp(1rem,2.2vw,1.25rem)] font-medium leading-snug text-[var(--hz-cobalt)]">
              {tagline}
            </p>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[16px]">
              {thanks}
            </p>
          </motion.div>

          {/* Founding facts, mirroring the artwork's footer */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 18 },
              show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
            }}
            className="mt-9 flex flex-col items-center justify-center gap-6 sm:mt-10 sm:flex-row sm:gap-12"
          >
            <Chip icon={CalendarDays} label="Founded on" value={FOUNDED_SHORT} />
            <span aria-hidden className="hidden h-10 w-px bg-[var(--hz-line)] sm:block" />
            <Chip icon={TrendingUp} label="Years of delivery" value={ANNIVERSARY_SPAN} />
          </motion.div>

          {/* The milestone rail that used to sit here was cut: the same six
              milestones already run down /about and /13-years, and a third copy
              turned the celebration band into a history lesson. The band states
              the occasion; the story page tells the story. */}

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 18 },
              show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
            }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:mt-12 sm:flex-row"
          >
            <Cta href={ANNIVERSARY_PATH} variant="primary" icon={ArrowRight}>
              {content.anniversaryCtaText || `Read our ${ANNIVERSARY_YEARS}-year story`}
            </Cta>
            <Cta href="/careers" variant="ghostLight">
              Join the team
            </Cta>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
