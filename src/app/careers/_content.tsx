"use client";

import Link from "next/link";
import {
  MapPin, ArrowRight, ArrowUpRight,
  Heart, Landmark, Calendar, type LucideIcon,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Cta } from "@/components/landing/ui";
import Photo from "@/components/landing/Photo";
import PageHero from "@/components/landing/PageHero";
import { IMG } from "@/components/landing/media";

/* ============================================================
   Careers.

   Everything here traces to a real source:
     · facts + offices        → the contact page and company record
     · practices              → the department list the job board filters on
     · culture + benefits     → copy supplied and confirmed by the business
     · EEO statement          → pre-existing legal copy

   An earlier draft of this file invented benefits detail (a 401(k)
   match "from your first month", paid certifications with scheduled
   study time). That was removed — anything stated here should be
   something a new hire can hold us to on day one.
   ============================================================ */

const facts = [
  { v: "50+", k: "Team members" },
  { v: "4", k: "Global offices" },
  { v: "Since 2013", k: "Growing" },
];

// Mirrors the `departments` filter on /careers/search, so every chip resolves
// to a real, populated search rather than an empty result.
const practices = [
  { name: "IT Staffing", desc: "Recruiters and delivery leads placing specialists with enterprise clients." },
  { name: "Cloud Services", desc: "Migration, DevOps, and platform engineering across AWS, Azure, and GCP." },
  { name: "Engineering", desc: "Mechanical, electrical, controls, and manufacturing engineers." },
  { name: "ERP Solutions", desc: "SAP, Oracle, and Microsoft Dynamics implementation and support." },
  { name: "Data & AI", desc: "Data engineering, analytics, and production machine learning." },
  { name: "Salesforce", desc: "Implementation, Apex and LWC development, and managed admin." },
  { name: "PMO", desc: "Programme and project managers running delivery across accounts." },
  { name: "Training", desc: "Enablement and upskilling for client and internal teams." },
];

/* Culture and benefits copy is the company's own, supplied and confirmed by
   the business. Presented in the page's editorial layout rather than the two
   flat icon-card grids it used to live in. */
// Culture cards lead with a photo (not an icon) — imagery carries "growth /
// balance / inclusion" more warmly than a glyph. Sourced from the shared IMG
// registry so they're real, valid Unsplash shots; swap for company photos when
// available.
const culture: { img: string; title: string; desc: string }[] = [
  { img: IMG.serviceEngineering, title: "Professional growth", desc: "We invest in your development through training, mentorship, and work on cutting-edge projects." },
  { img: IMG.aboutHero, title: "Work-life balance", desc: "Flexible working arrangements and a culture that respects your time outside work." },
  { img: IMG.serviceTalent, title: "Inclusive environment", desc: "A supportive workplace where every voice is heard and diversity is celebrated." },
];

const benefits: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Heart, title: "Health insurance", desc: "Comprehensive medical, dental, and vision coverage for you and your family." },
  { icon: Landmark, title: "Retirement plans", desc: "Robust 401(k) and savings options to help you build a secure financial future." },
  { icon: Calendar, title: "Paid time off", desc: "Generous vacation and sick leave so you have time to rest and recharge." },
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
      {/* ── Hero ───────────────────────────────────────────── */}
      <PageHero
        eyebrow="Careers"
        title="Build your career with our team."
        subtitle="We place engineers, recruiters, and delivery leads with enterprises and government agencies across North America, and we hire for the same disciplines ourselves."
        image={IMG.heroSlides[1]}
        actions={
          <>
            <Cta href="/careers/search" variant="primary">View open positions</Cta>
            <Cta href="/about" variant="ghostLight">About Ocean Blue</Cta>
          </>
        }
      />

      {/* The three figures used to sit inside the hero on a white-on-dark rule.
          On paper they need their own band. */}
      <section className="w-full bg-[var(--hz-paper)] py-12 sm:py-14">
        <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
          <dl className="grid max-w-3xl grid-cols-1 gap-x-4 gap-y-6 min-[400px]:grid-cols-3">
            {facts.map((f) => (
              <div key={f.k}>
                <dt className="hz-display hz-tnum text-[1.6rem] text-[var(--hz-text)] sm:text-[1.9rem]">{f.v}</dt>
                <dd className="hz-eyebrow mt-1 text-[var(--hz-text-mute)]">{f.k}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Practices, every chip is a real job-board department ── */}
      <section className="relative w-full border-y border-[var(--hz-band-line)] bg-[var(--hz-band)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span className="hz-eyebrow text-[var(--hz-cobalt)]">Where you&rsquo;d fit</span>
              <h2 className="hz-display mt-4 text-[clamp(1.75rem,3.4vw,2.75rem)] text-[var(--hz-text)]">
                The practices we hire into.
              </h2>
            </div>
            <Link
              href="/careers/search"
              className="group inline-flex flex-none items-center gap-2 text-[14px] font-semibold text-[var(--hz-cobalt)]"
            >
              Browse every role
              <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1" strokeWidth={1.75} />
            </Link>
          </Reveal>

          <Stagger className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4" gap={0.06}>
            {practices.map((p) => (
              <StaggerItem key={p.name} className="h-full">
                <Link
                  href={`/careers/search?department=${encodeURIComponent(p.name)}`}
                  className="group flex h-full flex-col rounded-2xl border border-[var(--hz-band-line)] bg-white p-6 transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-[var(--hz-cobalt-100)] hover:shadow-[var(--hz-shadow-md)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="hz-display text-[1.15rem] text-[var(--hz-text)]">{p.name}</h3>
                    <ArrowUpRight
                      className="mt-0.5 h-4 w-4 flex-none text-[var(--hz-text-subtle)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--hz-cobalt)]"
                      strokeWidth={1.75}
                    />
                  </div>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--hz-text-mute)]">{p.desc}</p>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Culture, sticky heading, hairline rows ────────── */}
      <section className="relative w-full py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 sm:px-8 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <span className="hz-eyebrow text-[var(--hz-cobalt)]">Our culture</span>
              <h2 className="hz-display mt-4 text-[clamp(1.75rem,3.4vw,2.75rem)] text-[var(--hz-text)]">
                A culture of growth and collaboration.
              </h2>
              <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-[var(--hz-text-mute)]">
                We foster a supportive, inclusive environment built on continuous learning
                and real impact for our clients.
              </p>
            </div>
          </Reveal>

          <Stagger className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-3" gap={0.08}>
            {culture.map((c) => (
              <StaggerItem key={c.title}>
                {/* Image leads the card; title + copy sit below it. */}
                <div className="flex h-full flex-col">
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl ring-1 ring-[var(--hz-band-line)]">
                    <Photo
                      src={c.img}
                      alt={c.title}
                      className="h-full w-full object-cover"
                      sizes="(min-width: 1024px) 260px, (min-width: 640px) 45vw, 100vw"
                    />
                  </div>
                  <h3 className="hz-display mt-5 text-[1.2rem] text-[var(--hz-text)] sm:text-[1.35rem]">{c.title}</h3>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--hz-text-mute)]">{c.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Benefits ───────────────────────────────────────── */}
      <section className="relative w-full border-y border-[var(--hz-band-line)] bg-[var(--hz-band)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <span className="hz-eyebrow text-[var(--hz-cobalt)]">Benefits</span>
            <h2 className="hz-display mt-4 text-[clamp(1.75rem,3.4vw,2.75rem)] text-[var(--hz-text)]">
              Benefits that have your back.
            </h2>
            <p className="mt-5 text-[15.5px] leading-relaxed text-[var(--hz-text-mute)]">
              A competitive package supporting the well-being and financial security of
              every team member.
            </p>
          </Reveal>

          <Stagger className="mt-12 grid gap-5 sm:mt-14 md:grid-cols-3" gap={0.09}>
            {benefits.map((b) => (
              <StaggerItem key={b.title} className="h-full">
                <div className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-7 transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-[var(--hz-cobalt-100)] hover:shadow-[var(--hz-shadow-md)] sm:p-8">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
                    <b.icon className="h-6 w-6" strokeWidth={1.5} />
                  </span>
                  <h3 className="hz-display mt-6 text-[1.25rem] text-[var(--hz-text)]">{b.title}</h3>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--hz-text-mute)]">{b.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Offices ────────────────────────────────────────── */}
      <section className="relative w-full py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 sm:px-8 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <span className="hz-eyebrow text-[var(--hz-cobalt)]">Where you&rsquo;d work</span>
            <h2 className="hz-display mt-4 text-[clamp(1.75rem,3.4vw,2.75rem)] text-[var(--hz-text)]">
              Four offices, three countries.
            </h2>
            <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-[var(--hz-text-mute)]">
              Headquartered in Powell, Ohio, with delivery centers in India and the UK.
              Individual roles list their own location and working arrangement on the
              posting.
            </p>
          </Reveal>

          <Stagger className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--hz-band-line)] bg-[var(--hz-band-line)] sm:grid-cols-2 lg:col-span-7" gap={0.08}>
            {offices.map((o) => (
              <StaggerItem key={o.city} className="bg-white">
                <div className="group h-full p-6 transition-colors duration-300 hover:bg-[var(--hz-band)] sm:p-7">
                  <MapPin className="h-5 w-5 text-[var(--hz-cobalt)]" strokeWidth={1.5} />
                  <h3 className="hz-display mt-4 text-[1.15rem] text-[var(--hz-text)]">{o.city}</h3>
                  <p className="mt-1 text-[13.5px] text-[var(--hz-text-mute)]">{o.country}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Equal opportunity ──────────────────────────────── */}
      <section className="relative w-full py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-7 sm:p-9">
              <h2 className="hz-display text-[1.25rem] text-[var(--hz-text)] sm:text-[1.5rem]">
                An equal opportunity employer
              </h2>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[var(--hz-text-mute)]">
                We do not discriminate on the basis of race, color, religion, sex, sexual
                orientation, gender identity, national origin, disability, or veteran
                status. If you need an accommodation at any point in the hiring process,
                tell your recruiter and we will arrange it.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="relative isolate w-full overflow-hidden" style={{ background: "#07142b" }}>
        <Photo src={IMG.cta} className="z-0" fallback="linear-gradient(135deg, #0e2147 0%, #07142b 100%)" sizes="100vw" />
        <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(5,12,28,0.9) 0%, rgba(7,20,43,0.84) 100%), radial-gradient(60% 80% at 50% 0%, rgba(29,78,216,0.4), transparent 60%)" }} />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center sm:px-8 sm:py-28 lg:py-32">
          <Reveal className="flex flex-col items-center">
            <h2 className="hz-display max-w-[16ch] text-[clamp(1.9rem,4.6vw,3rem)] text-white">
              Ready to join our team?
            </h2>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/70 sm:text-[17px]">
              See what is open right now, or send us your resume and we will keep it on
              file for roles that match.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Cta href="/careers/search" variant="primary">View open positions</Cta>
              <Cta href="/contact" variant="ghostDark">Get in touch</Cta>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
