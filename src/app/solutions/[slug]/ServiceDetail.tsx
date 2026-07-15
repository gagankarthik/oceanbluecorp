"use client";

import Link from "next/link";
import { ArrowRight, Check, Wrench, ArrowUpRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Eyebrow, Cta } from "@/components/landing/ui";
import Photo from "@/components/landing/Photo";
import { SOLUTIONS, SOLUTION_ORDER } from "./content";

/* A self-contained solution page. Deliberately does NOT reuse the
   landing stats / certifications sections — each page stands alone. */

function Related({ current }: { current: string }) {
  const siblings = SOLUTION_ORDER.filter((s) => s !== current)
    .slice(0, 5)
    .map((s) => SOLUTIONS[s]);

  return (
    <section className="relative w-full bg-[var(--hz-canvas)] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <Reveal className="flex items-end justify-between gap-6">
          <h2 className="hz-display text-[1.75rem] text-[var(--hz-text)] sm:text-[2.25rem]">Explore more solutions</h2>
          <Link href="/solutions" className="hidden shrink-0 items-center gap-1.5 text-[14px] font-semibold text-[var(--hz-cobalt)] hover:opacity-80 sm:inline-flex">
            View all
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {siblings.map((s) => (
            <Link
              key={s.slug}
              href={`/solutions/${s.slug}`}
              className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-sm"
            >
              <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
                <s.icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <span className="flex-1 text-[14.5px] font-semibold text-[var(--hz-text)] transition-colors group-hover:text-[var(--hz-cobalt)]">
                {s.eyebrow}
              </span>
              <ArrowRight className="h-4 w-4 flex-none -translate-x-1 text-[var(--hz-cobalt)] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
            </Link>
          ))}

          {/* Engineering — the fourth practice, on its own page */}
          <Link
            href="/solutions/engineering"
            className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-sm"
          >
            <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
              <Wrench className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <span className="flex-1 text-[14.5px] font-semibold text-[var(--hz-text)] transition-colors group-hover:text-[var(--hz-cobalt)]">
              Engineering Talent &amp; Services
            </span>
            <ArrowRight className="h-4 w-4 flex-none -translate-x-1 text-[var(--hz-cobalt)] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function ServiceDetail({ slug }: { slug: string }) {
  const data = SOLUTIONS[slug];
  const Icon = data.icon;

  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      {/* ---------- Hero ---------- */}
      <section className="relative isolate flex min-h-[62vh] w-full items-center overflow-hidden" style={{ background: "#07142b" }}>
        <Photo src={data.image} className="z-0" fallback="linear-gradient(135deg, #0e2147 0%, #07142b 100%)" priority sizes="100vw" />
        <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(100deg, rgba(5,12,28,0.95) 0%, rgba(7,20,43,0.86) 38%, rgba(7,20,43,0.5) 72%, rgba(7,20,43,0.3) 100%)" }} />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-32 pb-20 sm:px-8">
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--hz-cyan-400)]">{data.eyebrow}</span>
            </div>
            <h1 className="hz-display mt-7 max-w-[20ch] text-[2.5rem] text-white sm:text-[3.25rem] lg:text-[3.75rem]">
              {data.title}
            </h1>
            <p className="mt-7 max-w-2xl text-[16px] leading-relaxed text-white/75 sm:text-[18px]">{data.lede}</p>
            {data.tags && (
              <div className="mt-6 flex flex-wrap gap-2.5">
                {data.tags.map((t) => (
                  <span key={t} className="rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[12.5px] font-medium text-white/80">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-10 flex flex-wrap gap-3">
              <Cta href="/contact" variant="primary" icon={ArrowRight}>Start a conversation</Cta>
              <Link href="/solutions" className="hz-btn-ghost-dark">All solutions</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Overview + capabilities ---------- */}
      <section className="relative w-full bg-[var(--hz-canvas)] py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl items-start gap-14 px-6 sm:px-8 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-6">
            <span aria-hidden className="block h-[3px] w-12 rounded-full bg-[var(--hz-amber)]" />
            <h2 className="hz-display mt-7 text-[2rem] leading-[1.1] text-[var(--hz-text)] sm:text-[2.6rem]">
              {data.overviewHeading}
            </h2>
            <p className="mt-6 text-[16px] leading-relaxed text-[var(--hz-text-mute)]">{data.overviewBody}</p>
            <div className="mt-9">
              <Cta href="/contact" variant="ghostLight" icon={ArrowRight}>Talk to a specialist</Cta>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="lg:col-span-6">
            <div className="rounded-3xl border border-slate-200/80 bg-[var(--hz-surface-2)] p-8 sm:p-10">
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--hz-text-subtle)]">What we cover</p>
              <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3.5 sm:grid-cols-2">
                {data.capabilities.map((c) => (
                  <li key={c} className="flex items-start gap-3 text-[14.5px] leading-snug text-[var(--hz-text)]">
                    <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Highlights ---------- */}
      <section className="relative w-full border-y border-slate-200/70 bg-[var(--hz-ivory)] py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <h2 className="hz-display text-[2rem] text-[var(--hz-text)] sm:text-[2.5rem]">What you get.</h2>
          </Reveal>
          <Stagger className="mt-12 grid gap-6 md:grid-cols-3" gap={0.1}>
            {data.highlights.map((h) => (
              <StaggerItem key={h.title} className="h-full">
                <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
                    <h.icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="hz-display mt-6 text-[1.3rem] text-[var(--hz-text)]">{h.title}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-[var(--hz-text-mute)]">{h.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------- Approach ---------- */}
      <section className="relative w-full bg-[var(--hz-canvas)] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <span aria-hidden className="block h-[3px] w-12 rounded-full bg-[var(--hz-amber)]" />
            <h2 className="hz-display mt-7 text-[2rem] text-[var(--hz-text)] sm:text-[2.75rem]">How we deliver.</h2>
            <p className="mt-6 text-[16px] leading-relaxed text-[var(--hz-text-mute)]">
              A method you can hold us to — outcomes agreed up front, progress you can see.
            </p>
          </Reveal>
          <Stagger className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4" gap={0.1}>
            {data.approach.map((st, i) => (
              <StaggerItem key={st.title} className="h-full">
                <div className="hz-card h-full p-7">
                  <span className="hz-display text-[1.5rem] text-black/10">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="hz-display mt-4 text-[1.3rem] text-[var(--hz-text)]">{st.title}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-[var(--hz-text-mute)]">{st.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------- Related solutions ---------- */}
      <Related current={data.slug} />

      {/* ---------- CTA ---------- */}
      <section className="relative isolate w-full overflow-hidden border-t border-slate-200/70" style={{ background: "#07142b" }}>
        <div aria-hidden className="absolute inset-0 z-0" style={{ background: "radial-gradient(60% 80% at 50% 0%, rgba(29,78,216,0.35), transparent 60%)" }} />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center sm:px-8 sm:py-28">
          <Reveal className="flex flex-col items-center">
            <Eyebrow tone="dark">Let&apos;s talk</Eyebrow>
            <h2 className="hz-display mt-7 max-w-[18ch] text-[2.25rem] text-white sm:text-[3rem]">
              Ready to move on {data.eyebrow.toLowerCase()}?
            </h2>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/70 sm:text-[17px]">
              Tell us the outcome you need. We&apos;ll put the right people on it and stand behind the result.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Cta href="/contact" variant="primary" icon={ArrowRight}>Book a discovery call</Cta>
              <Cta href="/solutions" variant="ghostDark">All solutions</Cta>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
