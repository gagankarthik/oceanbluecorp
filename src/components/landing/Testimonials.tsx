"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Quote } from "lucide-react";
import { Reveal } from "./motion/Primitives";

type T = { quote: string; author: string; role: string; company: string };

const testimonials: T[] = [
  {
    quote:
      "Ocean Blue operates as a true strategic partner. Their team brings deep expertise, a disciplined approach to execution, and a consistent commitment to quality.",
    author: "Brian K.",
    role: "Co-Founder",
    company: "Pivotpoint",
  },
  {
    quote:
      "OceanBlue's resources demonstrated high levels of skill and professionalism, delivering quality results that met our expectations and deadlines.",
    author: "Damodar Buchi Reddy",
    role: "Project Director",
    company: "Diebold Nixdorf",
  },
  {
    quote:
      "I have partnered with Ocean Blue for many years. They are trustworthy, honest, motivated, and bring a high degree of work ethic to everything they do.",
    author: "Ken H.",
    role: "Senior Account Executive",
    company: "Mapsys, Inc.",
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;
const initials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("");

export default function Testimonials() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const t = testimonials[i];

  useEffect(() => {
    if (paused || reduce) return;
    const id = setInterval(() => setI((p) => (p + 1) % testimonials.length), 6000);
    return () => clearInterval(id);
  }, [paused, reduce]);

  return (
    <section className="relative w-full overflow-hidden bg-[var(--hz-ivory)] py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(48% 55% at 50% 0%, rgba(29,78,216,0.05), transparent 62%)" }}
      />
      <div
        className="relative mx-auto max-w-5xl px-6 sm:px-8"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <Reveal className="flex flex-col items-center text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-[var(--hz-cobalt)] shadow-[0_10px_30px_-12px_rgba(10,37,64,0.25)] ring-1 ring-black/[0.04]">
            <Quote className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <h2 className="hz-display mt-7 text-[1.6rem] text-[var(--hz-text)] sm:text-[2rem]">
            Trusted by the teams we work alongside.
          </h2>
        </Reveal>

        {/* Crossfading quote */}
        <div className="relative mt-10 min-h-[220px] sm:min-h-[200px]" role="group" aria-roledescription="carousel" aria-label="Client testimonials">
          <AnimatePresence mode="wait">
            <motion.figure
              key={i}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16, filter: "blur(6px)" }}
              transition={{ duration: 0.6, ease: EASE }}
              className="flex flex-col items-center text-center"
            >
              <blockquote className="hz-display mx-auto max-w-3xl text-[1.4rem] font-medium leading-[1.35] text-[var(--hz-text)] sm:text-[1.95rem] lg:text-[2.15rem]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-8 text-[14px]">
                <span className="font-semibold text-[var(--hz-text)]">{t.author}</span>
                <span className="text-[var(--hz-text-mute)]"> · {t.role}, {t.company}</span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        {/* Interactive author rail */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {testimonials.map((item, idx) => {
            const isActive = idx === i;
            return (
              <button
                key={item.author}
                onClick={() => setI(idx)}
                aria-label={`Show testimonial from ${item.author}`}
                aria-current={isActive}
                className={`group flex items-center gap-3 rounded-full border py-2 pl-2 pr-4 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  isActive
                    ? "border-transparent bg-white shadow-[0_14px_30px_-16px_rgba(10,37,64,0.35)]"
                    : "border-slate-200/80 bg-white/40 hover:bg-white/80"
                }`}
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-full text-[12px] font-semibold transition-colors duration-300 ${
                    isActive ? "bg-[var(--hz-cobalt)] text-white" : "bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]"
                  }`}
                  style={isActive ? { boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)" } : undefined}
                >
                  {initials(item.author)}
                </span>
                <span className="flex flex-col items-start leading-tight">
                  <span className={`text-[13px] font-semibold ${isActive ? "text-[var(--hz-text)]" : "text-[var(--hz-text-mute)]"}`}>
                    {item.author}
                  </span>
                  <span className="text-[11.5px] text-[var(--hz-text-subtle)]">{item.company}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
