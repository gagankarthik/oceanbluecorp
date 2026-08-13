"use client";

import Link from "next/link";
import { ArrowRight, Check, Wrench, ArrowUpRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Eyebrow, Cta } from "@/components/landing/ui";
import Photo from "@/components/landing/Photo";
import PageHero from "@/components/landing/PageHero";
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
              className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-sm bg-[var(--hz-ink)]">
              <span className="flex-none text-[var(--hz-cobalt)]">
                <s.icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <span className="flex-1 text-[14.5px] font-semibold text-[var(--hz-text)] transition-colors group-hover:text-[var(--hz-cobalt)]">
                {s.eyebrow}
              </span>
              <ArrowRight className="h-4 w-4 flex-none -translate-x-1 text-[var(--hz-cobalt)] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
            </Link>
          ))}

          {/* Engineering, the fourth practice, on its own page */}
          <Link
            href="/solutions/engineering"
            className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-sm bg-[var(--hz-ink)]">
            <span className="flex-none text-[var(--hz-cobalt)]">
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
      <PageHero
        eyebrow={data.eyebrow}
        title={data.title}
        subtitle={data.lede}
        image={data.image}
        actions={
          <>
            <Cta href="/contact" variant="primary">Start a conversation</Cta>
            <Link
              href="/solutions"
              className="inline-flex items-center rounded-full border border-[var(--hz-text)]/25 px-7 py-3.5 text-[15px] font-semibold text-[var(--hz-text)] transition-colors hover:border-[var(--hz-text)] bg-[var(--hz-ink)]">
              All solutions
            </Link>
          </>
        }
      />

      {data.tags && (
        <section className="w-full bg-[var(--hz-paper)] pb-2 pt-10">
          <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
            <div className="flex flex-wrap gap-2.5">
              {data.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[var(--hz-paper-line)] px-3.5 py-1.5 text-[12.5px] font-medium text-[var(--hz-text-mute)] bg-[var(--hz-ink)]">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Overview + capabilities ---------- */}
      <section className="relative w-full bg-[var(--hz-canvas)] py-20 sm:py-28 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-start gap-14 px-6 sm:px-8 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-6">
            <span aria-hidden className="block h-[3px] w-12 rounded-full bg-[var(--hz-cobalt)]" />
            <h2 className="hz-display mt-7 text-[2rem] leading-[1.1] text-[var(--hz-text)] sm:text-[2.6rem]">
              {data.overviewHeading}
            </h2>
            <p className="mt-6 text-[16px] leading-relaxed text-[var(--hz-text-mute)]">{data.overviewBody}</p>
            <div className="mt-9">
              <Cta href="/contact" variant="ghostLight">Talk to a specialist</Cta>
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
                  <div className="text-[var(--hz-cobalt)]">
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
      <section className="relative w-full bg-[var(--hz-canvas)] py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <span aria-hidden className="block h-[3px] w-12 rounded-full bg-[var(--hz-cobalt)]" />
            <h2 className="hz-display mt-7 text-[2rem] text-[var(--hz-text)] sm:text-[2.75rem]">How we deliver.</h2>
            <p className="mt-6 text-[16px] leading-relaxed text-[var(--hz-text-mute)]">
              A method you can hold us to, outcomes agreed up front, progress you can see.
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
      <section className="relative isolate w-full overflow-hidden border-t border-slate-200/70 bg-[var(--hz-ink)]">
        <div aria-hidden className="absolute inset-0 z-0" style={{ background: "radial-gradient(60% 80% at 50% 0%, rgba(29,78,216,0.35), transparent 60%)" }} />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center sm:px-8 sm:py-28">
          <Reveal className="flex flex-col items-center">
            <Eyebrow tone="dark">Let&apos;s talk</Eyebrow>
            <h2 className="hz-display mt-7 max-w-[18ch] text-[clamp(1.9rem,4.6vw,3rem)] text-white">
              Ready to move on {data.eyebrow.toLowerCase()}?
            </h2>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/70 sm:text-[17px]">
              Tell us the outcome you need. We&apos;ll put the right people on it and stand behind the result.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Cta href="/contact" variant="primary">Book a discovery call</Cta>
              <Cta href="/solutions" variant="ghostDark">All solutions</Cta>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
