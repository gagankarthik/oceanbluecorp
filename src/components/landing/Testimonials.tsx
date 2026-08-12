"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./motion/Primitives";

/* ============================================================
   Client work — customer.io's case-study rows.

   Theirs is the strongest pattern on that page and the one this
   site had no equivalent of. Each entry is a full-width tinted
   band carrying, in one row: the client's logo, one or two hard
   numbers set large, the quote, who said it, and a link through.
   The tint changes per client, so the section reads as a series of
   distinct engagements rather than a wall of undifferentiated
   praise.

   Why it beats what was here: three quote cards gave every client
   the same weight and led with opinion. This leads with a NUMBER,
   and the quote arrives as corroboration. That is the difference
   between "they say we are good" and "here is what happened".

   ── The honest limitation ────────────────────────────────────
   customer.io can do this because it has published metrics per
   client. Ocean Blue does not — so `metrics` below is optional,
   and a row without it degrades to logo + quote + attribution
   rather than inventing a statistic. Nothing here fabricates a
   number. Fill them in as real, client-approved figures land, and
   this section gets dramatically stronger for free.
   ============================================================ */

type Metric = { value: string; label: string };
type Story = {
  company: string;
  quote: string;
  author: string;
  role: string;
  /** Real, client-approved figures only. Empty until they exist. */
  metrics?: Metric[];
  /** Tint + ink per entry, so the rows read as separate engagements. */
  tint: string;
  ink: string;
};

const stories: Story[] = [
  {
    company: "Pivotpoint",
    quote:
      "Ocean Blue operates as a true strategic partner. Their team brings deep expertise, a disciplined approach to execution, and a consistent commitment to quality.",
    author: "Brian K.",
    role: "Co-Founder",
    tint: "#EAF2FA",
    ink: "#0B4A7A",
  },
  {
    company: "Diebold Nixdorf",
    quote:
      "OceanBlue's resources demonstrated high levels of skill and professionalism, delivering quality results that met our expectations and deadlines.",
    author: "Damodar Buchi Reddy",
    role: "Project Director",
    tint: "#F3F0EA",
    ink: "#6B4A21",
  },
  {
    company: "Mapsys, Inc.",
    quote:
      "I have partnered with Ocean Blue for many years. They are trustworthy, honest, motivated, and bring a high degree of work ethic to everything they do.",
    author: "Ken H.",
    role: "Senior Account Executive",
    tint: "#EDF4F1",
    ink: "#1F5945",
  },
];

function StoryRow({ s }: { s: Story }) {
  return (
    <article
      className="grid gap-8 rounded-2xl p-8 sm:p-10 lg:grid-cols-12 lg:items-center lg:gap-10"
      style={{ background: s.tint }}
    >
      <div className="lg:col-span-4">
        {/* The company name set as a solid chip, standing in for the logo
            lock-up customer.io uses. A real client logo drops straight in
            here when one is cleared for use. */}
        <span
          className="inline-flex items-center rounded-md px-3.5 py-2 text-[15px] font-semibold text-white"
          style={{ background: s.ink }}
        >
          {s.company}
        </span>

        {s.metrics && s.metrics.length > 0 && (
          <div className="mt-7 flex gap-8">
            {s.metrics.map((m) => (
              <div key={m.label}>
                <p className="hz-display hz-tnum text-[2rem] leading-none" style={{ color: s.ink }}>
                  {m.value}
                </p>
                <p className="mt-2 max-w-[16ch] text-[12.5px] leading-snug text-[var(--hz-text-mute)]">
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-7 lg:col-start-6">
        <blockquote
          className="text-[1.1rem] leading-[1.55] tracking-[-0.01em] sm:text-[1.25rem]"
          style={{ color: s.ink }}
        >
          {s.quote}
        </blockquote>
        <footer className="mt-6 flex flex-wrap items-baseline gap-x-2.5">
          <span className="text-[14.5px] font-semibold text-[var(--hz-text)]">{s.author}</span>
          <span className="text-[13px] text-[var(--hz-text-mute)]">{s.role}</span>
        </footer>
      </div>
    </article>
  );
}

export default function Testimonials() {
  return (
    <section className="relative w-full bg-[var(--hz-paper)] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="hz-eyebrow inline-flex items-center gap-2 text-[var(--hz-cobalt)]">
            Client work
          </span>
            <h2 className="hz-display hz-h2 mt-4 text-[var(--hz-text)]">
              The partners who know our work best.
            </h2>
          </div>
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 text-[14.5px] font-semibold text-[var(--hz-cobalt)]"
          >
            <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1" strokeWidth={2} />
            Talk to a reference
          </Link>
        </Reveal>

        <Stagger className="mt-12 space-y-4 sm:mt-14" gap={0.1}>
          {stories.map((s) => (
            <StaggerItem key={s.company}>
              <StoryRow s={s} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
