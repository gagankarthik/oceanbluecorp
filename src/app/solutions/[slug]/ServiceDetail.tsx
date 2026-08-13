"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Cta } from "@/components/landing/ui";
import { AccentHeading } from "@/components/landing/bands";
import Photo from "@/components/landing/Photo";
import PageHero from "@/components/landing/PageHero";
import { SOLUTIONS, SOLUTION_ORDER } from "./content";

/* A single service. The reader already knows which one they want, so the page
   answers "what exactly do you cover" first: the capability list is the
   centrepiece, set as a numbered scope sheet rather than buried in a panel.

   Related practices sit at the foot as a compact chip row, not another
   full-width section, because they are an exit rather than content. */

function relatedLinks(current: string) {
  const rows = SOLUTION_ORDER.filter((s) => s !== current).map((s) => ({
    title: SOLUTIONS[s].eyebrow,
    href: `/solutions/${s}`,
  }));
  rows.push({ title: "Engineering Talent & Services", href: "/solutions/engineering" });
  return rows;
}

export default function ServiceDetail({ slug }: { slug: string }) {
  const data = SOLUTIONS[slug];

  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      <PageHero
        eyebrow={data.eyebrow}
        title={data.title}
        subtitle={data.lede}
        image={data.image}
        actions={
          <>
            <Cta href="/contact" variant="primary">Start a conversation</Cta>
            <Cta href="/solutions" variant="ghostLight">All solutions</Cta>
          </>
        }
      />

      {data.tags && (
        <div className="w-full border-b border-[var(--hz-line)] px-6 py-5 sm:px-10 lg:px-16 2xl:px-24">
          <ul className="flex flex-wrap gap-2.5">
            {data.tags.map((t) => (
              <li
                key={t}
                className="rounded-full border border-[var(--hz-line)] px-3.5 py-1.5 text-[12.5px] font-medium text-[var(--hz-text-mute)]"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <Reveal className="max-w-3xl">
          <AccentHeading>{data.overviewHeading}</AccentHeading>
          <p className="mt-8 text-[17px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[19px]">
            {data.overviewBody}
          </p>
        </Reveal>
      </section>

      {/* The scope sheet. Numbered so the breadth is countable at a glance,
          which is the question this page exists to answer. */}
      <section className="w-full border-t border-[var(--hz-line)] px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="hz-display hz-h2 max-w-[14ch] text-[var(--hz-text)]">What we cover.</h2>
          <p className="hz-eyebrow text-[var(--hz-text-subtle)]">
            {String(data.capabilities.length).padStart(2, "0")} capabilities
          </p>
        </Reveal>
        <Stagger
          as="ol"
          className="mt-10 grid gap-x-14 border-t border-[var(--hz-line)] sm:mt-12 lg:grid-cols-2"
          gap={0.05}
        >
          {data.capabilities.map((c, i) => (
            <StaggerItem as="li" key={c} className="border-b border-[var(--hz-paper-line)]">
              <div className="flex items-baseline gap-5 py-4">
                <span className="hz-display hz-tnum text-[13px] leading-none text-[var(--hz-cobalt)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[15px] leading-snug text-[var(--hz-text-mute)] sm:text-[16px]">{c}</span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal className="mt-10">
          <Cta href="/contact" variant="ghostLight">Talk to a specialist</Cta>
        </Reveal>
      </section>

      {/* Outcomes and method, side by side: two short lists that would
          otherwise become two more full-width bands. */}
      <section className="w-full border-t border-[var(--hz-line)] px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <Reveal>
              <h2 className="hz-display hz-h2 text-[var(--hz-text)]">What you get.</h2>
            </Reveal>
            <Stagger as="ul" className="mt-8 divide-y divide-[var(--hz-paper-line)] border-y border-[var(--hz-paper-line)]" gap={0.06}>
              {data.highlights.map((h) => (
                <StaggerItem as="li" key={h.title} className="py-5">
                  <h3 className="hz-display text-[1.05rem] leading-tight text-[var(--hz-text)]">{h.title}</h3>
                  <p className="mt-2 max-w-[46ch] text-[14px] leading-relaxed text-[var(--hz-text-mute)]">{h.desc}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            <Reveal>
              <h2 className="hz-display hz-h2 text-[var(--hz-text)]">How we deliver.</h2>
            </Reveal>
            <Stagger as="ol" className="mt-8" gap={0.06}>
              {data.approach.map((st, i) => (
                <StaggerItem as="li" key={st.title} className="grid grid-cols-[2.25rem_1fr] gap-4 pb-6 last:pb-0">
                  <span className="hz-display hz-tnum text-[1rem] leading-tight text-[var(--hz-cobalt)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="hz-display text-[1.05rem] leading-tight text-[var(--hz-text)]">{st.title}</h3>
                    <p className="mt-1.5 max-w-[42ch] text-[14px] leading-relaxed text-[var(--hz-text-mute)]">{st.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* Siblings as a chip row: an exit, not a section. */}
      <section className="w-full border-t border-[var(--hz-line)] px-6 py-14 sm:px-10 sm:py-16 lg:px-16 2xl:px-24">
        <Reveal>
          <h2 className="hz-eyebrow text-[var(--hz-text-subtle)]">Explore more solutions</h2>
          <ul className="mt-6 flex flex-wrap gap-2.5">
            {relatedLinks(data.slug).map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  className="hz-focus group inline-flex items-center gap-2 rounded-full border border-[var(--hz-line)] px-4 py-2 text-[13.5px] font-medium text-[var(--hz-text-mute)] transition-colors hover:border-[var(--hz-cobalt)] hover:text-[var(--hz-cobalt)]"
                >
                  {r.title}
                  <ArrowUpRight
                    className="h-3.5 w-3.5 text-[var(--hz-line-2)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--hz-cobalt)]"
                    strokeWidth={2}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section className="relative isolate w-full overflow-hidden">
        <div className="relative min-h-[380px] w-full sm:min-h-[440px]">
          <Photo src={data.image} alt={`Talk to us about ${data.eyebrow}`} sizes="100vw" priority={false} />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,23,48,0.62) 0%, rgba(10,23,48,0.82) 60%, rgba(10,23,48,0.94) 100%)",
            }}
          />
          <div className="relative z-10 flex min-h-[380px] items-center px-6 py-16 sm:min-h-[440px] sm:px-10 lg:px-16 2xl:px-24">
            <Reveal className="max-w-2xl">
              <h2 className="hz-display max-w-[18ch] text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.05] text-white">
                Ready to move on {data.eyebrow.toLowerCase()}?
              </h2>
              <p className="mt-6 max-w-[46ch] text-[16px] leading-relaxed text-white/80 sm:text-[17px]">
                Tell us the outcome you need. We will put the right people on it and
                stand behind the result.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Cta href="/contact" variant="primary">Book a discovery call</Cta>
                <Cta href="/solutions" variant="ghostDark">All solutions</Cta>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
