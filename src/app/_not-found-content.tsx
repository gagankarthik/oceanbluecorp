"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Cta } from "@/components/landing/ui";

/**
 * The 404 composition.
 *
 * Split out of not-found.tsx so that file can stay a server component and keep
 * its `metadata` export while the motion lives here.
 *
 * One orchestrated entrance rather than scattered effects: the glow opens, the
 * three digits drop in sequence, then the copy and the ways out follow. The
 * sequence reads as the page arriving once, which is the only motion a dead
 * end warrants.
 *
 * Everything animates transform and opacity only, so it stays on the
 * compositor. Under prefers-reduced-motion the whole thing renders in its
 * final state with no transition, including the ambient glow.
 */

const DIGITS = ["4", "0", "4"];

const destinations = [
  { title: "Solutions", href: "/solutions" },
  { title: "Careers", href: "/careers" },
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export default function NotFoundContent() {
  const reduce = useReducedMotion();

  // One timeline, so every delay below is expressed relative to the same start
  // rather than guessed per element.
  const step = (i: number) => (reduce ? 0 : 0.09 * i);

  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0.2 : 0.7, delay, ease: EASE },
  });

  return (
    <section className="relative isolate flex min-h-[78svh] w-full items-center justify-center overflow-hidden px-6 py-20 sm:px-10 sm:py-24">
      {/* Ambient glow behind the numeral. Held at a low opacity so it reads as
          light in the room rather than as a shape. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[520px] w-[520px] -translate-x-1/2 -translate-y-[62%] rounded-full sm:h-[680px] sm:w-[680px]"
        style={{
          background:
            "radial-gradient(circle, rgba(29,78,216,0.16) 0%, rgba(29,78,216,0.06) 42%, transparent 68%)",
        }}
        initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.82 }}
        animate={
          reduce
            ? { opacity: 1, scale: 1 }
            : { opacity: 1, scale: [0.82, 1.04, 1] }
        }
        transition={{ duration: reduce ? 0 : 1.9, ease: EASE }}
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        {/* The numeral, per digit. Each one is clipped so it rises out of its
            own line rather than fading on the spot. */}
        <h1 className="sr-only">404, page not found</h1>
        <p aria-hidden className="flex items-end justify-center">
          {DIGITS.map((d, i) => (
            <span key={i} className="block overflow-hidden pb-[0.06em]">
              <motion.span
                className="hz-display hz-tnum block text-[clamp(5.5rem,20vw,12rem)] leading-[0.78] tracking-[-0.055em] text-[var(--hz-cobalt)]"
                initial={reduce ? { opacity: 0 } : { y: "108%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{
                  duration: reduce ? 0.2 : 0.95,
                  delay: step(i),
                  ease: EASE,
                }}
              >
                {d}
              </motion.span>
            </span>
          ))}
        </p>

        <motion.p
          aria-hidden
          className="mt-9 h-px w-16 origin-center bg-[var(--hz-line-2)]"
          initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: reduce ? 0 : 0.7, delay: step(3), ease: EASE }}
        />

        <motion.h2
          {...rise(step(3.4))}
          className="hz-display hz-h2 mt-9 max-w-[18ch] text-[var(--hz-text)]"
        >
          This page does not exist.
        </motion.h2>

        <motion.p
          {...rise(step(4))}
          className="mt-6 max-w-[46ch] text-[16px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[17px]"
        >
          The address may be mistyped, or the page may have moved since you last
          saw it. Nothing is broken on your end.
        </motion.p>

        <motion.div
          {...rise(step(4.6))}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Cta href="/" variant="primary" icon={ArrowRight}>Back to home</Cta>
          <Cta href="/contact" variant="ghostLight">Contact us</Cta>
        </motion.div>

        <motion.div
          {...rise(step(5.2))}
          className="mt-14 w-full border-t border-[var(--hz-line)] pt-8 sm:mt-16"
        >
          <p className="hz-eyebrow text-[var(--hz-text-subtle)]">Or try one of these</p>
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {destinations.map((d, i) => (
              <motion.li
                key={d.href}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduce ? 0.2 : 0.55,
                  delay: step(5.6) + (reduce ? 0 : i * 0.06),
                  ease: EASE,
                }}
              >
                <Link
                  href={d.href}
                  className="hz-focus group inline-flex items-center gap-1.5 text-[15px] font-semibold text-[var(--hz-text)] transition-colors hover:text-[var(--hz-cobalt)]"
                >
                  {d.title}
                  <ArrowRight
                    className="h-4 w-4 text-[var(--hz-text-subtle)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:text-[var(--hz-cobalt)]"
                    strokeWidth={2}
                  />
                </Link>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
