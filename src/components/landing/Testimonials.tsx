"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
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

  // Auto-advancing carousel — advances on a timer, pauses on hover/focus, and
  // stops entirely when the visitor prefers reduced motion.
  useEffect(() => {
    if (paused || reduce) return;
    const id = setInterval(() => setI((p) => (p + 1) % testimonials.length), 5500);
    return () => clearInterval(id);
  }, [paused, reduce]);

  return (
    <section className="relative w-full overflow-hidden bg-[var(--hz-ivory)] py-20 sm:py-28 lg:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(45% 55% at 50% 0%, rgba(29,78,216,0.05), transparent 60%)" }}
      />
      <div
        className="relative mx-auto max-w-4xl px-5 text-center sm:px-8"
        role="group"
        aria-roledescription="carousel"
        aria-label="Client testimonials"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <Reveal>
          <Quote className="mx-auto h-9 w-9 text-[var(--hz-cobalt)] sm:h-10 sm:w-10" strokeWidth={1.5} aria-hidden="true" />

          {/* Sliding track — one testimonial per slide */}
          <div className="mt-6 overflow-hidden">
            <div
              className="flex"
              style={{
                transform: `translateX(-${i * 100}%)`,
                transition: reduce ? "none" : "transform 0.7s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              {testimonials.map((t, idx) => (
                <figure
                  key={t.author}
                  className="flex w-full shrink-0 flex-col px-1 sm:px-4"
                  aria-roledescription="slide"
                  aria-label={`${idx + 1} of ${testimonials.length}`}
                  aria-hidden={idx !== i}
                >
                  <blockquote className="hz-display text-[1.35rem] font-medium leading-[1.35] text-[var(--hz-text)] sm:text-[1.75rem] lg:text-[2.1rem]">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-7 flex flex-col items-center sm:mt-8">
                    <span
                      className="grid h-11 w-11 place-items-center rounded-full bg-[var(--hz-cobalt)] text-[13px] font-semibold text-white sm:h-12 sm:w-12"
                      style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)" }}
                    >
                      {t.author.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </span>
                    <span className="mt-3 text-[14.5px] font-semibold text-[var(--hz-text)]">{t.author}</span>
                    <span className="text-[13px] text-[var(--hz-text-mute)]">{t.role} · {t.company}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="mt-9 flex items-center justify-center gap-2.5">
            {testimonials.map((t, idx) => (
              <button
                key={t.author}
                onClick={() => setI(idx)}
                aria-label={`Show testimonial ${idx + 1}`}
                aria-current={idx === i}
                className="group flex h-10 min-w-[40px] items-center justify-center px-1.5"
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
