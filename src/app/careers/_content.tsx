"use client";

import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Users, Cloud, Cog, Database, Brain, CloudCog,
  ClipboardList, GraduationCap, HeartPulse, PiggyBank, Palmtree, Rocket,
  Scale, UsersRound, type LucideIcon,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Cta } from "@/components/landing/ui";
import Photo from "@/components/landing/Photo";
import PageHero from "@/components/landing/PageHero";
import { IMG } from "@/components/landing/media";

/* Careers leads with the JOB and with pictures of the place, because this is
   the one page on the site whose reader is deciding whether they want to be
   here rather than whether to buy something. Everything on it is a tile, a
   figure or a photograph; nothing is a paragraph the reader has to wade into.

   Everything traces to a real source:
     facts + offices    the contact page and company record
     departments        the filter list on /careers/search
     culture + benefits copy supplied and confirmed by the business
     EEO statement      pre-existing legal copy

   An earlier draft invented benefits detail (a 401(k) match "from your first
   month", paid certifications with scheduled study time). Anything stated
   here should be something a new hire can hold us to on day one. */

const facts = [
  { v: "50+", k: "Team members" },
  { v: "4", k: "Global offices" },
  { v: "8", k: "Practices hiring" },
  { v: "2013", k: "Building since" },
];

/* Mirrors the `departments` filter on /careers/search, so every tile resolves
   to a real, populated search rather than an empty result. */
const departments: { name: string; icon: LucideIcon; blurb: string }[] = [
  { name: "IT Staffing", icon: Users, blurb: "Recruiters and delivery leads placing specialists" },
  { name: "Cloud Services", icon: Cloud, blurb: "AWS, Azure and GCP migration and platform work" },
  { name: "Engineering", icon: Cog, blurb: "Mechanical, electrical, controls and manufacturing" },
  { name: "ERP Solutions", icon: Database, blurb: "SAP, Oracle and Microsoft Dynamics" },
  { name: "Data & AI", icon: Brain, blurb: "Data engineering, analytics and production ML" },
  { name: "Salesforce", icon: CloudCog, blurb: "Apex, LWC and managed administration" },
  { name: "PMO", icon: ClipboardList, blurb: "Programme and project delivery across accounts" },
  { name: "Training", icon: GraduationCap, blurb: "Enablement for client and internal teams" },
];

const culture: { title: string; desc: string; icon: LucideIcon }[] = [
  { title: "Professional growth", icon: Rocket, desc: "Training, mentorship, and work on projects that are current rather than legacy maintenance." },
  { title: "Work-life balance", icon: Palmtree, desc: "Flexible working arrangements and a culture that respects your time outside work." },
  { title: "Inclusive environment", icon: UsersRound, desc: "A supportive workplace where every voice is heard and diversity is celebrated." },
];

const benefits: { title: string; desc: string; icon: LucideIcon }[] = [
  { title: "Health insurance", icon: HeartPulse, desc: "Comprehensive medical, dental, and vision coverage for you and your family." },
  { title: "Retirement plans", icon: PiggyBank, desc: "Robust 401(k) and savings options to help you build a secure financial future." },
  { title: "Paid time off", icon: Palmtree, desc: "Generous vacation and sick leave so you have time to rest and recharge." },
];

const offices = [
  { city: "Powell, Ohio", country: "United States" },
  { city: "Hyderabad", country: "India" },
  { city: "Vizianagaram", country: "India" },
  { city: "London", country: "United Kingdom" },
];

export default function CareersPage() {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      <PageHero
        eyebrow="Careers"
        title="Own the work, not a ticket queue."
        subtitle="We place engineers, recruiters and delivery leads with enterprises and government agencies across North America, and we hire for the same disciplines ourselves."
        image={IMG.heroSlides[1]}
        actions={
          <>
            <Cta href="/careers/search" variant="primary">View open positions</Cta>
            <Cta href="#life" variant="ghostDark">What it is like here</Cta>
          </>
        }
      />

      {/* Numbers band. Four figures beat four sentences at the top of a
          recruitment page. */}
      <section className="w-full border-b border-[var(--hz-line)] bg-[var(--hz-paper)]">
        <div className="mx-auto grid w-full max-w-[2200px] grid-cols-2 divide-x divide-y divide-[var(--hz-line)] sm:grid-cols-4 sm:divide-y-0">
          {facts.map((f) => (
            <div key={f.k} className="px-6 py-8 sm:px-10 sm:py-10">
              <p className="hz-display hz-tnum text-[clamp(1.9rem,3.6vw,2.75rem)] leading-none text-[var(--hz-cobalt)]">
                {f.v}
              </p>
              <p className="hz-eyebrow mt-3 text-[var(--hz-text-subtle)]">{f.k}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The job board, up front, as tiles carrying an icon, a name and a line
          of what the team actually does. */}
      <section className="w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="hz-display hz-h2 text-[var(--hz-text)]">
              Find the team you belong on.
            </h2>
            <p className="mt-5 max-w-[52ch] text-[16px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[17px]">
              Eight practices, all hiring. Pick the one that matches what you do
              and see what is open right now.
            </p>
          </div>
          <Link
            href="/careers/search"
            className="hz-focus group inline-flex items-center gap-2 text-[14.5px] font-semibold text-[var(--hz-cobalt)]"
          >
            Browse every role
            <ArrowRight
              className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1"
              strokeWidth={2}
            />
          </Link>
        </Reveal>

        <Stagger className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4" gap={0.05}>
          {departments.map((d) => (
            <StaggerItem key={d.name} className="h-full">
              <Link
                href={`/careers/search?department=${encodeURIComponent(d.name)}`}
                className="hz-focus group flex h-full flex-col rounded-2xl border border-[var(--hz-line)] bg-white p-6 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-[var(--hz-cobalt)]/40 hover:shadow-[var(--hz-shadow-md)]"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] transition-colors duration-300 group-hover:bg-[var(--hz-cobalt)] group-hover:text-white">
                  <d.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="hz-display mt-5 text-[1.1rem] leading-tight text-[var(--hz-text)]">
                  {d.name}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--hz-text-mute)]">
                  {d.blurb}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[13px] font-semibold text-[var(--hz-cobalt)]">
                  See open roles
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Life here. Photography carries this, not paragraphs. */}
      <section
        id="life"
        className="w-full scroll-mt-24 border-t border-[var(--hz-line)] bg-[var(--hz-paper)] px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24"
      >
        <Reveal className="max-w-2xl">
          <h2 className="hz-display hz-h2 text-[var(--hz-text)]">What it is like here.</h2>
          <p className="mt-5 max-w-[52ch] text-[16px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[17px]">
            Our engineers are embedded with the client and accountable for the
            outcome, which means you carry real scope from the first week and you
            see what your work changed.
          </p>
        </Reveal>

        {/* A mosaic at three sizes, so the block reads as a place rather than a
            row of identical stock frames. */}
        <div className="mt-10 grid gap-4 sm:mt-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-7 lg:row-span-2">
            <div className="relative aspect-[16/11] w-full overflow-hidden rounded-2xl lg:h-full">
              <Photo src={IMG.serviceTalent} alt="An Ocean Blue team working together" sizes="(min-width: 1024px) 58vw, 92vw" />
            </div>
          </Reveal>
          <Reveal delay={0.06} className="lg:col-span-5">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
              <Photo src={IMG.serviceEngineering} alt="An engineer at work on a test rig" sizes="(min-width: 1024px) 40vw, 92vw" />
            </div>
          </Reveal>
          <Reveal delay={0.12} className="lg:col-span-5">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
              <Photo src={IMG.aboutTeam} alt="An Ocean Blue team meeting" sizes="(min-width: 1024px) 40vw, 92vw" />
            </div>
          </Reveal>
        </div>

        <Stagger className="mt-12 grid gap-8 sm:grid-cols-3 lg:gap-10" gap={0.08}>
          {culture.map((c) => (
            <StaggerItem key={c.title}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-[var(--hz-cobalt)] ring-1 ring-[var(--hz-paper-line)]">
                <c.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="hz-display mt-5 text-[1.15rem] leading-tight text-[var(--hz-text)]">{c.title}</h3>
              <p className="mt-2.5 max-w-[40ch] text-[14.5px] leading-relaxed text-[var(--hz-text-mute)]">{c.desc}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Benefits and locations, side by side. */}
      <section className="w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal>
              <h2 className="hz-display hz-h2 text-[var(--hz-text)]">What we offer.</h2>
            </Reveal>
            <Stagger as="ul" className="mt-9 grid gap-5" gap={0.07}>
              {benefits.map((b) => (
                <StaggerItem as="li" key={b.title}>
                  <div className="flex gap-5 rounded-2xl border border-[var(--hz-line)] bg-white p-6">
                    <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
                      <b.icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div>
                      <h3 className="hz-display text-[1.1rem] leading-tight text-[var(--hz-text)]">{b.title}</h3>
                      <p className="mt-2 max-w-[52ch] text-[14.5px] leading-relaxed text-[var(--hz-text-mute)]">{b.desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal>
              <h2 className="hz-display text-[1.5rem] leading-tight text-[var(--hz-text)]">Where we work.</h2>
              <p className="mt-4 max-w-[36ch] text-[14.5px] leading-relaxed text-[var(--hz-text-mute)]">
                Four offices across three countries, and roles in all of them.
              </p>
            </Reveal>
            <Stagger as="ul" className="mt-7 divide-y divide-[var(--hz-line)] border-y border-[var(--hz-line)]" gap={0.05}>
              {offices.map((o) => (
                <StaggerItem as="li" key={o.city} className="flex items-baseline justify-between gap-4 py-3.5">
                  <span className="text-[14.5px] font-semibold text-[var(--hz-text)]">{o.city}</span>
                  <span className="text-[12.5px] text-[var(--hz-text-subtle)]">{o.country}</span>
                </StaggerItem>
              ))}
            </Stagger>

            <Reveal className="mt-8">
              <div className="rounded-2xl border border-[var(--hz-line)] bg-[var(--hz-paper)] p-6">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[var(--hz-cobalt)] ring-1 ring-[var(--hz-paper-line)]">
                  <Scale className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </span>
                <h3 className="hz-display mt-4 text-[1rem] leading-tight text-[var(--hz-text)]">
                  An equal opportunity employer
                </h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-[var(--hz-text-mute)]">
                  We do not discriminate on the basis of race, color, religion,
                  sex, sexual orientation, gender identity, national origin,
                  disability, or veteran status. Need an accommodation during
                  hiring? Tell your recruiter and we will arrange it.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Close on a photograph with the ask over it. */}
      <section className="relative isolate w-full overflow-hidden">
        <div className="relative min-h-[420px] w-full sm:min-h-[480px]">
          <Photo src={IMG.cta} alt="An Ocean Blue interview conversation" sizes="100vw" priority={false} />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,23,48,0.62) 0%, rgba(10,23,48,0.80) 60%, rgba(10,23,48,0.94) 100%)",
            }}
          />
          <div className="relative z-10 flex min-h-[420px] items-center px-6 py-16 sm:min-h-[480px] sm:px-10 lg:px-16 2xl:px-24">
            <Reveal className="max-w-2xl">
              <h2 className="hz-display max-w-[16ch] text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.05] text-white">
                Ready to join our team?
              </h2>
              <p className="mt-6 max-w-[46ch] text-[16px] leading-relaxed text-white/80 sm:text-[17px]">
                See what is open right now, or send us your resume and we will keep
                it on file for roles that match.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Cta href="/careers/search" variant="primary">View open positions</Cta>
                <Cta href="/contact" variant="ghostDark">Get in touch</Cta>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
