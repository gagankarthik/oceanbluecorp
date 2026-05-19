"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHeader } from "./landing/SectionHeader";

/* ============================================================
   TESTIMONIALS — real Ocean Blue clients, Register aesthetic.
   Desktop: 3-up grid. Mobile: swipeable carousel.
   ============================================================ */

type Testimonial = {
  quote: string;
  author: string;
  role: string;
  company: string;
  initials: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      "Ocean Blue Solutions operates as a true strategic partner. Their team brings deep expertise, a disciplined approach to execution, and a consistent commitment to quality.",
    author: "Brian K.",
    role: "Co-Founder",
    company: "Pivotpoint",
    initials: "BK",
  },
  {
    quote:
      "OceanBlue resources demonstrated high levels of skill and professionalism, delivering quality results that met our expectations and deadlines.",
    author: "Damodar Buchi Reddy",
    role: "Project Director",
    company: "Diebold Nixdorf",
    initials: "DR",
  },
  {
    quote:
      "I have partnered with Ocean Blue for many years. They are trustworthy, honest, motivated and display a high degree of work ethic.",
    author: "Ken H.",
    role: "Senior Account Executive",
    company: "Mapsys, Inc.",
    initials: "KH",
  },
];

function TestimonialCard({ t, featured }: { t: Testimonial; featured?: boolean }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex h-full flex-col rounded-2xl border p-6 transition-all sm:p-7 ${
        featured
          ? "border-[var(--reg-brand-200)] bg-[var(--reg-brand-25)] shadow-[var(--reg-shadow-md)]"
          : "border-[var(--reg-line)] bg-[var(--reg-surface)] shadow-[var(--reg-shadow-xs)] hover:shadow-[var(--reg-shadow-md)]"
      }`}
    >
      {/* Top row: quote mark + rating */}
      <div className="flex items-center justify-between">
        <span
          className={`grid h-8 w-8 place-items-center rounded-lg ${
            featured
              ? "bg-[var(--reg-brand-600)] text-white"
              : "bg-[var(--reg-brand-50)] text-[var(--reg-brand-700)]"
          }`}
        >
          <Quote className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div className="flex">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-[#f79009] text-[#f79009]" />
          ))}
        </div>
      </div>

      {/* Quote */}
      <blockquote className="mt-5 text-[15.5px] leading-relaxed text-[var(--reg-text-primary)] sm:text-[16px]">
        &ldquo;{t.quote}&rdquo;
      </blockquote>

      {/* Author + engagement */}
      <figcaption className="mt-6 flex items-center gap-3 border-t border-[var(--reg-line)] pt-5">
        <div
          className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-full text-[12px] font-semibold ${
            featured
              ? "bg-[var(--reg-brand-600)] text-white"
              : "bg-[var(--reg-brand-100)] text-[var(--reg-brand-700)]"
          }`}
        >
          {t.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold text-[var(--reg-text-primary)]">
            {t.author}
          </p>
          <p className="truncate text-[12px] text-[var(--reg-text-subtle)]">
            {t.role} · {t.company}
          </p>
        </div>
      </figcaption>
    </motion.figure>
  );
}

export default function TestimonialsShowcase() {
  const [active, setActive] = useState(0);
  const total = testimonials.length;

  const prev = () => setActive((p) => (p - 1 + total) % total);
  const next = () => setActive((p) => (p + 1) % total);

  return (
    <section className="bg-white px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Client voices"
          title={<>What our clients <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">say about us.</span></>}
          subtitle="Real partnerships, in their own words. These are leaders we've worked alongside on the projects that mattered most to their business."
        />

        {/* Desktop grid */}
        <div className="mt-12 hidden grid-cols-3 gap-4 md:grid">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.author} t={t} featured={i === 1} />
          ))}
        </div>

        {/* Mobile carousel */}
        <div className="mt-10 md:hidden">
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <TestimonialCard t={testimonials[active]} featured />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`Show testimonial ${i + 1}`}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === active ? 24 : 8,
                    background:
                      i === active ? "var(--reg-brand-600)" : "var(--reg-line-2)",
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={prev}
                aria-label="Previous testimonial"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--reg-line)] bg-[var(--reg-surface)] text-[var(--reg-text-secondary)] transition-colors hover:bg-[var(--reg-surface-3)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={next}
                aria-label="Next testimonial"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--reg-line)] bg-[var(--reg-surface)] text-[var(--reg-text-secondary)] transition-colors hover:bg-[var(--reg-surface-3)]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
