"use client";

import { Linkedin, ArrowRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Eyebrow, Cta } from "@/components/landing/ui";
import Photo from "@/components/landing/Photo";
import { IMG } from "@/components/landing/media";

const leadership = [
  { name: "Sarojini Gude", role: "President", initials: "SG", linkedin: "" },
  { name: "Brent Wallace", role: "SVP, Workforce Solutions", initials: "BW", linkedin: "https://www.linkedin.com/in/brentwallace1/" },
  { name: "Sushma Moturu", role: "Human Resource Director", initials: "SM", linkedin: "https://www.linkedin.com/in/sushma-moturu-4ba752236/" },
  { name: "Clark Cristofoli", role: "Executive Recruiter", initials: "CC", linkedin: "https://www.linkedin.com/in/clark-cristofoli-0402b988/" },
];

const values = [
  { title: "Senior by default", desc: "Engagements are led by people who have done the work before — not learning on your time." },
  { title: "Accountable, end to end", desc: "One team owns the outcome, from the first conversation to the quarterly review." },
  { title: "Human-centered", desc: "Clear communication and collaborative execution. No black boxes, no surprises." },
];

export default function TeamPage() {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      {/* Hero */}
      <section className="relative isolate flex min-h-[58vh] w-full items-center overflow-hidden" style={{ background: "#07142b" }}>
        <Photo src={IMG.teamHero} className="z-0" fallback="linear-gradient(135deg, #0e2147 0%, #07142b 100%)" />
        <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(100deg, rgba(5,12,28,0.95) 0%, rgba(7,20,43,0.86) 40%, rgba(7,20,43,0.5) 74%, rgba(7,20,43,0.3) 100%)" }} />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-32 pb-20 sm:px-8">
          <Reveal>
            <Eyebrow tone="dark">Our team</Eyebrow>
            <h1 className="hz-display mt-7 max-w-[16ch] text-[2rem] break-words text-white sm:text-[3.25rem] lg:text-[4rem]">
              The people behind the work.
            </h1>
            <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-white/75 sm:text-[18px]">
              Senior practitioners who lead from the front — and a delivery bench that
              integrates with your team from day one.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Leadership */}
      <section className="relative w-full py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <Eyebrow>Leadership</Eyebrow>
            <h2 className="hz-display mt-6 text-[2.25rem] text-[var(--hz-text)] sm:text-[3rem]">Meet the people who run it.</h2>
          </Reveal>
          <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" gap={0.08}>
            {leadership.map((l) => {
              const Card = (
                <div className="hz-card flex h-full flex-col items-center p-8 text-center">
                  <span className="grid h-20 w-20 place-items-center rounded-full bg-[var(--hz-cobalt)] text-[1.4rem] font-semibold text-white" style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)" }}>
                    {l.initials}
                  </span>
                  <h3 className="hz-display mt-6 text-[1.2rem] text-[var(--hz-text)]">{l.name}</h3>
                  <p className="mt-1 text-[13.5px] text-[var(--hz-cobalt)]">{l.role}</p>
                  {l.linkedin && (
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-[var(--hz-text-subtle)]">
                      <Linkedin className="h-3.5 w-3.5" strokeWidth={1.75} /> LinkedIn
                    </span>
                  )}
                </div>
              );
              return (
                <StaggerItem key={l.name} className="h-full">
                  {l.linkedin ? (
                    <a href={l.linkedin} target="_blank" rel="noopener noreferrer" className="block h-full">{Card}</a>
                  ) : Card}
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* How the team works */}
      <section className="relative w-full bg-[var(--hz-surface-2)] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <Eyebrow>How we operate</Eyebrow>
            <h2 className="hz-display mt-6 text-[2.25rem] text-[var(--hz-text)] sm:text-[3rem]">A team you can hold to the outcome.</h2>
          </Reveal>
          <Stagger className="mt-14 grid gap-6 md:grid-cols-3" gap={0.1}>
            {values.map((v, i) => (
              <StaggerItem key={v.title} className="h-full">
                <div className="hz-card h-full p-8">
                  <span className="hz-display text-[1.5rem] text-[var(--hz-cobalt)]">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="hz-display mt-4 text-[1.3rem] text-[var(--hz-text)]">{v.title}</h3>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--hz-text-mute)]">{v.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate w-full overflow-hidden" style={{ background: "#07142b" }}>
        <Photo src={IMG.cta} className="z-0" fallback="linear-gradient(135deg, #0e2147 0%, #07142b 100%)" />
        <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(5,12,28,0.9) 0%, rgba(7,20,43,0.84) 100%), radial-gradient(60% 80% at 50% 0%, rgba(29,78,216,0.4), transparent 60%)" }} />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center sm:px-8 sm:py-32">
          <Reveal className="flex flex-col items-center">
            <Eyebrow tone="dark">Join us</Eyebrow>
            <h2 className="hz-display mt-7 max-w-[16ch] text-[2.25rem] text-white sm:text-[3rem]">Build your career with our team.</h2>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Cta href="/careers" variant="primary" icon={ArrowRight}>View open roles</Cta>
              <Cta href="/about" variant="ghostDark">About Ocean Blue</Cta>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
