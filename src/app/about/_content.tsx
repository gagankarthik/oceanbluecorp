"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Cta } from "@/components/landing/ui";
import { SplitBand, ArrowRows, AccentHeading } from "@/components/landing/bands";
import Photo from "@/components/landing/Photo";
import { UserCheck, Server, Landmark, type LucideIcon } from "lucide-react";
import PageHero from "@/components/landing/PageHero";
import { IMG } from "@/components/landing/media";
import { MILESTONES, FOUNDED_YEAR } from "@/lib/company";

/* About is the NARRATIVE page, and the thing it owns that no other page has is
   thirteen years of history. So the timeline is the spine here, given real
   scale as a vertical rail, rather than one list among several. */

const values = [
  { title: "People who own the outcome, not the ticket", href: "/careers" },
  { title: "Senior practitioners on the work from day one", href: "/team" },
  { title: "Security and compliance designed in, never retrofitted", href: "/solutions/cloud" },
  { title: "One accountable team across talent and technology", href: "/solutions" },
];

const strengths: { title: string; body: string; icon: LucideIcon }[] = [
  { icon: UserCheck, title: "Specialized talent", body: "Skilled IT professionals who integrate into your teams rather than sit alongside them." },
  { icon: Server, title: "Enterprise-grade delivery", body: "Cloud, ERP and AI work built to survive contact with a real production estate." },
  { icon: Landmark, title: "Industry depth", body: "Healthcare, government, financial services, manufacturing, retail and technology." },
];

export default function AboutPage({ content = {} }: { content?: Record<string, string> }) {
  const years = new Date().getFullYear() - FOUNDED_YEAR;

  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      <PageHero
        eyebrow="Who we are"
        title={content.aboutTitle || "We build the technology and teams that move organizations forward."}
        subtitle={
          content.aboutSubtitle ||
          "A partner for IT staffing, enterprise solutions, and digital transformation, delivering clarity, expertise, and measurable results."
        }
        image={IMG.aboutHero}
      />

      <section className="w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <Reveal className="w-full">
          <AccentHeading>Our purpose</AccentHeading>
          <div className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-2 lg:gap-16">
            <p className="text-[17px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[19px]">
              Technology should make people&apos;s work simpler, not give them a
              second job managing it. We help organizations modernize the systems
              they already run, strengthen the teams around them, and adopt what
              actually changes how the business performs.
            </p>
            <p className="text-[16px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[17px]">
              Thirteen years of doing that has left us with a bias toward clarity
              and very little patience for complexity that serves the vendor rather
              than the client. We exist to give organizations the technology, talent
              and support to operate faster and more securely, with deep technical
              expertise and a genuine commitment to service behind it.
            </p>
          </div>
        </Reveal>
      </section>

      {/* The spine. A vertical rail with the years running down it, given the
          full width of the page. This is the page's one big moment. */}
      <section className="w-full border-t border-[var(--hz-line)] px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-8">
          <h2 className="hz-display max-w-[14ch] text-[clamp(2rem,4.6vw,3.4rem)] leading-[1.03] text-[var(--hz-text)]">
            {years} years, in order.
          </h2>
          <p className="max-w-[38ch] text-[15px] leading-relaxed text-[var(--hz-text-subtle)] sm:text-[16px]">
            From a single office in Ohio to four across three countries, with the
            practices added as clients asked for them.
          </p>
        </Reveal>

        <Stagger as="ol" className="relative mt-14 sm:mt-16" gap={0.09}>
          {/* The rail itself, behind the entries. */}
          <span
            aria-hidden
            className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--hz-line)] sm:left-[9px]"
          />
          {MILESTONES.map((m) => (
            <StaggerItem as="li" key={m.year} className="relative pl-10 pb-12 last:pb-0 sm:pl-14">
              <span
                aria-hidden
                className="absolute left-0 top-[6px] h-[15px] w-[15px] rounded-full border-2 border-[var(--hz-cobalt)] bg-[var(--hz-canvas)] sm:left-[2px] sm:h-[17px] sm:w-[17px]"
              />
              <div className="grid gap-2 lg:grid-cols-12 lg:items-baseline lg:gap-10">
                <span className="hz-display hz-tnum block text-[1.75rem] leading-none text-[var(--hz-cobalt)] lg:col-span-2 sm:text-[2rem]">
                  {m.year}
                </span>
                <h3 className="hz-display text-[1.3rem] leading-tight text-[var(--hz-text)] lg:col-span-4 sm:text-[1.5rem]">
                  {m.title}
                </h3>
                <p className="max-w-[52ch] text-[15px] leading-relaxed text-[var(--hz-text-mute)] lg:col-span-6 sm:text-[16px]">
                  {m.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* One split band on this page, not four. It carries the values, which
          are the only part of About that wants a face beside it. */}
      <SplitBand
        image={IMG.servicesHero}
        alt="Ocean Blue engineers working with a client team"
        side="right"
        caption="Engineers embedded with the client, accountable for the outcome."
      >
        <h2 className="hz-display hz-h2 max-w-[16ch] text-[var(--hz-text)]">
          What we hold ourselves to.
        </h2>
        <ArrowRows rows={values} className="mt-9" />
      </SplitBand>

      <section className="w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <Reveal className="max-w-2xl">
          <h2 className="hz-display hz-h2 text-[var(--hz-text)]">A partner you can hold to it.</h2>
        </Reveal>
        <Stagger className="mt-10 grid gap-10 sm:mt-12 sm:grid-cols-3 lg:gap-12" gap={0.08}>
          {strengths.map((s) => (
            <StaggerItem key={s.title}>
              <span aria-hidden className="block h-px w-full bg-[var(--hz-line)]" />
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
                <s.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="hz-display mt-5 text-[1.2rem] leading-tight text-[var(--hz-text)]">{s.title}</h3>
              <p className="mt-3 max-w-[42ch] text-[14.5px] leading-relaxed text-[var(--hz-text-mute)]">{s.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Closing photograph, full-bleed with the ask over it. */}
      <section className="relative isolate w-full overflow-hidden">
        <div className="relative min-h-[400px] w-full sm:min-h-[460px]">
          <Photo src={IMG.aboutTeam} alt="An Ocean Blue engagement meeting" sizes="100vw" priority={false} />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,23,48,0.60) 0%, rgba(10,23,48,0.80) 60%, rgba(10,23,48,0.94) 100%)",
            }}
          />
          <div className="relative z-10 flex min-h-[400px] items-center px-6 py-16 sm:min-h-[460px] sm:px-10 lg:px-16 2xl:px-24">
            <Reveal className="max-w-2xl">
              <h2 className="hz-display max-w-[16ch] text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.05] text-white">
                Work with a team that owns the outcome.
              </h2>
              <p className="mt-6 max-w-[46ch] text-[16px] leading-relaxed text-white/80 sm:text-[17px]">
                Tell us what you are trying to change and we will tell you, plainly,
                whether we are the right people for it.
              </p>
              <div className="mt-9">
                <Cta href="/contact" variant="primary">Start a conversation</Cta>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
