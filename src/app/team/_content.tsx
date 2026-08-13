"use client";

import { Linkedin } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Cta } from "@/components/landing/ui";
import { AccentHeading } from "@/components/landing/bands";
import Photo from "@/components/landing/Photo";
import PageHero from "@/components/landing/PageHero";
import { IMG } from "@/components/landing/media";

/* Team is a ROSTER. The page's whole job is "who are these people", so the
   leadership wall is the page rather than one section inside it.

   Monogram tiles at portrait scale, not small avatar circles: we have no
   photographs of these people, and a stock face standing in for a named
   individual would be a lie. Large initials read as a deliberate treatment;
   a tiny circle reads as a missing image. */

const leadership = [
  { name: "Sarojini Gude", role: "President", initials: "SG", linkedin: "" },
  { name: "Brent Wallace", role: "SVP, Workforce Solutions", initials: "BW", linkedin: "https://www.linkedin.com/in/brentwallace1/" },
  { name: "Sushma Moturu", role: "Human Resource Director", initials: "SM", linkedin: "https://www.linkedin.com/in/sushma-moturu-4ba752236/" },
  { name: "Clark Cristofoli", role: "Executive Recruiter", initials: "CC", linkedin: "https://www.linkedin.com/in/clark-cristofoli-0402b988/" },
];

const operating = [
  { title: "Senior by default", desc: "Engagements are led by people who have done the work before, not learning on your time." },
  { title: "Accountable end to end", desc: "One team owns the outcome, from the first conversation to the quarterly review." },
  { title: "No black boxes", desc: "Clear communication and collaborative execution, with a standing account of where things stand." },
];

export default function TeamPage() {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      <PageHero
        eyebrow="Our team"
        title="The people behind the work."
        subtitle="Senior practitioners who lead from the front, and a delivery bench that integrates with your team from day one."
        image={IMG.teamHero}
      />

      {/* The wall. Four portrait-scale monogram tiles, which is the page's
          one distinctive shape. */}
      <section className="w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <Reveal className="max-w-2xl">
          <AccentHeading>Leadership</AccentHeading>
          <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[19px]">
            The people accountable for the work, and the ones you will actually be
            dealing with.
          </p>
        </Reveal>

        <Stagger
          className="mt-12 grid gap-6 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4"
          gap={0.08}
        >
          {leadership.map((l) => (
            <StaggerItem key={l.name} className="h-full">
              <article className="flex h-full flex-col">
                <span
                  aria-hidden
                  className="hz-display grid aspect-[4/5] w-full place-items-center rounded-2xl bg-[var(--hz-surface-2)] text-[clamp(3rem,7vw,4.5rem)] leading-none tracking-[-0.04em] text-[var(--hz-cobalt)] ring-1 ring-[var(--hz-paper-line)]"
                >
                  {l.initials}
                </span>
                <h3 className="hz-display mt-6 text-[1.2rem] leading-tight text-[var(--hz-text)]">{l.name}</h3>
                <p className="mt-1.5 text-[14px] text-[var(--hz-text-subtle)]">{l.role}</p>
                {/* Rendered only where a profile exists: a LinkedIn mark that
                    goes nowhere is worse than no mark. */}
                {l.linkedin && (
                  <a
                    href={l.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hz-focus mt-4 inline-flex items-center gap-2 self-start text-[13px] font-semibold text-[var(--hz-text-mute)] transition-colors hover:text-[var(--hz-cobalt)]"
                  >
                    <Linkedin className="h-4 w-4" strokeWidth={1.75} />
                    <span>LinkedIn</span>
                    <span className="sr-only">profile for {l.name}</span>
                  </a>
                )}
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* How the team operates, as three plain statements under a rule. */}
      <section className="w-full border-t border-[var(--hz-line)] px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <Reveal className="max-w-2xl">
          <h2 className="hz-display hz-h2 text-[var(--hz-text)]">
            A team you can hold to the outcome.
          </h2>
        </Reveal>
        <Stagger className="mt-10 grid gap-10 sm:mt-12 sm:grid-cols-3 lg:gap-12" gap={0.08}>
          {operating.map((o) => (
            <StaggerItem key={o.title}>
              <span aria-hidden className="block h-px w-full bg-[var(--hz-line)]" />
              <h3 className="hz-display mt-6 text-[1.2rem] leading-tight text-[var(--hz-text)]">{o.title}</h3>
              <p className="mt-3 max-w-[40ch] text-[14.5px] leading-relaxed text-[var(--hz-text-mute)]">{o.desc}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="relative isolate w-full overflow-hidden">
        <div className="relative min-h-[400px] w-full sm:min-h-[460px]">
          <Photo src={IMG.heroSlides[1]} alt="The Ocean Blue team at work" sizes="100vw" priority={false} />
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
                Build your career with our team.
              </h2>
              <p className="mt-6 max-w-[46ch] text-[16px] leading-relaxed text-white/80 sm:text-[17px]">
                We hire for the same disciplines we place, and the people we hire
                carry real scope from the first week.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Cta href="/careers" variant="primary">View open roles</Cta>
                <Cta href="/about" variant="ghostDark">About Ocean Blue</Cta>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
