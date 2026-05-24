"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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

export default function Testimonials() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (paused || reduce) return;
    const id = setInterval(() => setI((p) => (p + 1) % testimonials.length), 6500);
    return () => clearInterval(id);
  }, [paused, reduce]);

  const active = testimonials[i];

  return (
    <section className="relative w-full overflow-hidden bg-[var(--hz-canvas)] py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(45% 55% at 50% 0%, rgba(29,78,216,0.05), transparent 60%)" }}
      />
      <div
        className="relative mx-auto max-w-4xl px-6 text-center sm:px-8"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <Reveal>
          <Quote className="mx-auto h-10 w-10 text-[var(--hz-cobalt)]" strokeWidth={1.5} />
          <div className="mt-6 min-h-[260px] sm:min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.figure
                key={i}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -20, filter: "blur(4px)" }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <blockquote className="hz-display text-[1.6rem] font-medium leading-[1.32] text-[var(--hz-text)] sm:text-[2.1rem]">
                  {active.quote}
                </blockquote>
                <figcaption className="mt-8 flex flex-col items-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--hz-cobalt)] text-[13px] font-semibold text-white" style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)" }}>
                    {active.author.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </span>
                  <span className="mt-3 text-[14.5px] font-semibold text-[var(--hz-text)]">{active.author}</span>
                  <span className="text-[13px] text-[var(--hz-text-mute)]">{active.role} · {active.company}</span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="mt-9 flex items-center justify-center gap-2.5">
            {testimonials.map((t, idx) => (
              <button
                key={t.author}
                onClick={() => setI(idx)}
                aria-label={`Show testimonial ${idx + 1}`}
                className="group p-1.5"
              >
                <span
                  className="block h-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-[var(--hz-cobalt)]"
                  style={{ width: idx === i ? 26 : 8, background: idx === i ? "var(--hz-cobalt)" : "rgba(15,23,42,0.2)" }}
                />
              </button>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
