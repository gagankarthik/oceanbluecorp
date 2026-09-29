"use client";

import Link from "next/link";
import PageHero from "@/components/landing/PageHero";
import { IMG } from "@/components/landing/media";
import { OFFICES } from "@/components/landing/Locations";
import { Band, Section, SectionTitle, ClosingCta } from "@/components/site/sections";
import { CertificationStrip } from "@/components/site/credentials";
import { IconArrowRight, IconTalent, IconServer, IconBuilding, type Icon } from "@/components/site/icons";
import { IconPin } from "@/components/site/company/icons";
import { MILESTONES, FOUNDED_YEAR } from "@/lib/company";

/* About is the NARRATIVE page. It owns what no other page has: the purpose,
   the years in order, the standard we hold ourselves to, where we deliver
   from, and the certifications. Each of those gets one section, in that order. */

const VALUES = [
  { title: "People who own the outcome, not the ticket", href: "/careers" },
  { title: "Senior practitioners on the work from day one", href: "/team" },
  { title: "Security and compliance designed in, never retrofitted", href: "/solutions/cloud" },
  { title: "One accountable team across talent and technology", href: "/solutions" },
];

const STRENGTHS: { title: string; body: string; icon: Icon }[] = [
  { icon: IconTalent, title: "Specialized talent", body: "Skilled IT professionals who integrate into your teams rather than sit alongside them." },
  { icon: IconServer, title: "Enterprise-grade delivery", body: "Cloud, ERP and AI work built to survive contact with a real production estate." },
  { icon: IconBuilding, title: "Industry depth", body: "Healthcare, government, financial services, manufacturing, retail and technology." },
];

export default function AboutPage({ content = {} }: { content?: Record<string, string> }) {
  const years = new Date().getFullYear() - FOUNDED_YEAR;

  return (
    <>
      <PageHero
        eyebrow="About us"
        title={content.aboutTitle || "We build the technology and teams that move organizations forward."}
        subtitle={
          content.aboutSubtitle ||
          "A partner for IT staffing, enterprise solutions, and digital transformation, delivering clarity, expertise, and measurable results."
        }
        image={IMG.aboutHero}
      />

      {/* Purpose: the one paragraph that explains everything below it. */}
      <Band>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <h2 className="reveal type-headline text-ink">Our purpose</h2>
          <div className="reveal space-y-5">
            <p className="type-body-lg text-ink">
              Technology should make people&apos;s work simpler, not give them a second job managing it. We help organizations
              modernize the systems they already run, strengthen the teams around them, and adopt what actually changes how the
              business performs.
            </p>
            <p className="text-[16.5px] leading-relaxed text-ink-muted">
              {years} years of doing that has left us with a bias toward clarity and very little patience for complexity that
              serves the vendor rather than the client. We exist to give organizations the technology, talent and support to
              operate faster and more securely, with deep technical expertise and a genuine commitment to service behind it.
            </p>
          </div>
        </div>
      </Band>

      {/* The spine: the years in order. Sticky heading on the left, the rail
          running down the right, so the story reads as one column of time. */}
      <Band muted>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <h2 className="reveal type-headline text-ink">
                {years} years, in order
              </h2>
              <p className="reveal mt-5 max-w-[42ch] type-body-lg text-ink-muted">
                From a single office in Ohio to four across three countries, with the practices added as clients asked for them.
              </p>
            </div>
          </div>
          <ol className="relative lg:col-span-8">
            <span aria-hidden className="absolute top-3 bottom-3 left-[7px] w-px bg-line-strong" />
            {MILESTONES.map((m, i) => (
              <li key={m.year} className="reveal relative pb-6 pl-10 last:pb-0 sm:pl-12">
                <span
                  aria-hidden
                  className={`absolute top-6 left-0 size-[15px] rounded-full border-2 border-cobalt ${
                    i === MILESTONES.length - 1 ? "bg-cobalt" : "bg-paper"
                  }`}
                />
                <div className="grid gap-2 rounded-2xl border border-line bg-white p-6 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-6">
                  <span className="type-title-lg text-cobalt tabular-nums">{m.year}</span>
                  <div>
                    <h3 className="type-title text-ink">{m.title}</h3>
                    <p className="mt-1.5 type-body-sm text-ink-muted">{m.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Band>

      {/* The standard: what we hold ourselves to, each line leading somewhere. */}
      <Section tone="white" title="What we hold ourselves to" sub="Four commitments, each backed by a page that shows how we keep it.">
        <ul className="grid gap-[3px] bg-paper-deep sm:grid-cols-2">
          {VALUES.map((v) => (
            <li key={v.title}>
              <Link href={v.href} className="group flex h-full min-h-[150px] flex-col justify-between gap-8 bg-white p-8 transition-colors hover:bg-paper">
                <span className="max-w-[30ch] type-title-lg text-ink">{v.title}</span>
                <IconArrowRight size={18} className="text-ink-subtle transition-all group-hover:translate-x-1 group-hover:text-cobalt" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* Strengths as an asymmetric split: the claim on the left, the three
          ways it shows up as a hairline list on the right. */}
      <Band muted>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h2 className="reveal type-headline text-ink">A partner you can hold to it</h2>
            <p className="reveal mt-5 max-w-[40ch] type-body-lg text-ink-muted">
              What a client gets from us, whichever practice they start with.
            </p>
          </div>
          <ul className="reveal divide-y divide-line border-y border-line lg:col-span-7">
            {STRENGTHS.map((st) => (
              <li key={st.title} className="grid grid-cols-[44px_minmax(0,1fr)] gap-5 py-7 sm:grid-cols-[52px_minmax(0,1fr)]">
                <span className="flex size-11 items-center justify-center rounded-lg border border-line bg-white text-cobalt sm:size-12">
                  <st.icon size={22} />
                </span>
                <div>
                  <h3 className="type-title-lg text-ink">{st.title}</h3>
                  <p className="mt-1.5 max-w-[56ch] type-body-sm text-ink-muted">{st.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Band>

      {/* Where the work is delivered from. Full addresses and the map live on Contact. */}
      <Band>
        <SectionTitle title="Where we deliver from" sub="Four offices across the United States, India and the United Kingdom." />
        <ul className="reveal mt-10 grid gap-[3px] sm:mt-12 bg-paper-deep sm:grid-cols-2 lg:grid-cols-4">
          {OFFICES.map((o) => (
            <li key={o.city} className="bg-white p-7">
              <IconPin size={22} className="text-cobalt" />
              <p className="mt-5 flex items-center gap-2 type-title text-ink">
                {o.city}
                {o.hq && <span className="rounded-full bg-cobalt-tint px-2 py-0.5 text-[11.5px] font-semibold text-cobalt">Headquarters</span>}
              </p>
              <p className="mt-1 text-[15px] text-ink-muted">{o.country}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 text-center">
          <Link href="/contact#locations" className="group inline-flex items-center gap-2 text-[15px] font-semibold text-ink hover:text-cobalt">
            Addresses and phone numbers <IconArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </Band>

      <CertificationStrip />

      <ClosingCta
        title="Work with a team that owns the outcome"
        sub="Tell us what you are trying to change and we will tell you, plainly, whether we are the right people for it."
        secondary={{ href: "/team", label: "Meet the team" }}
      />
    </>
  );
}
