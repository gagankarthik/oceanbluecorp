"use client";

import {
  Clock, Users, Calendar, Heart, Landmark, GraduationCap, ArrowRight, type LucideIcon,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Cta } from "@/components/landing/ui";
import Photo from "@/components/landing/Photo";
import { IMG } from "@/components/landing/media";

const facts = [
  { v: "50+", k: "Team members" },
  { v: "4", k: "Global offices" },
  { v: "Since 2013", k: "Growing" },
];

const culture: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: GraduationCap, title: "Professional growth", desc: "We invest in your development through training, mentorship, and work on cutting-edge projects." },
  { icon: Clock, title: "Work-life balance", desc: "Flexible working arrangements and a culture that respects your time outside work." },
  { icon: Users, title: "Inclusive environment", desc: "A supportive workplace where every voice is heard and diversity is celebrated." },
];

const benefits: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Heart, title: "Health insurance", desc: "Comprehensive medical, dental, and vision coverage for you and your family." },
  { icon: Landmark, title: "Retirement plans", desc: "Robust 401(k) and savings options to help you build a secure financial future." },
  { icon: Calendar, title: "Paid time off", desc: "Generous vacation and sick leave so you have time to rest and recharge." },
];

function Card({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="hz-card h-full p-8">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
        <Icon className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <h3 className="hz-display mt-6 text-[1.25rem] text-[var(--hz-text)]">{title}</h3>
      <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--hz-text-mute)]">{desc}</p>
    </div>
  );
}

export default function CareersPage() {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      {/* Hero */}
      <section className="relative isolate flex min-h-[62vh] w-full items-center overflow-hidden" style={{ background: "#07142b" }}>
        <Photo src={IMG.heroSlides[1]} className="z-0" fallback="linear-gradient(135deg, #0e2147 0%, #07142b 100%)" />
        <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(100deg, rgba(5,12,28,0.95) 0%, rgba(7,20,43,0.86) 40%, rgba(7,20,43,0.5) 74%, rgba(7,20,43,0.3) 100%)" }} />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-32 pb-20 sm:px-8">
          <Reveal>
            <h1 className="hz-display max-w-[16ch] text-[2rem] break-words text-white sm:text-[3.25rem] lg:text-[4rem]">
              Build your career with our team.
            </h1>
            <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-white/75 sm:text-[18px]">
              Join the engineers, recruiters, and problem-solvers shaping enterprise IT — and grow with a partner that backs its people.
            </p>
            <div className="mt-10">
              <Cta href="/careers/search" variant="primary" icon={ArrowRight}>View open positions</Cta>
            </div>
            <dl className="mt-14 grid max-w-2xl grid-cols-1 min-[400px]:grid-cols-3 gap-x-4 gap-y-6 border-t border-white/15 pt-8">
              {facts.map((f) => (
                <div key={f.k}>
                  <dt className="hz-display hz-tnum text-[1.6rem] text-white sm:text-[1.9rem]">{f.v}</dt>
                  <dd className="hz-eyebrow mt-1 text-white/55">{f.k}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Culture */}
      <section className="relative w-full py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <h2 className="hz-display text-[2.25rem] text-[var(--hz-text)] sm:text-[3rem]">A culture of growth and collaboration.</h2>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-[var(--hz-text-mute)]">
              We foster a supportive, inclusive environment built on continuous learning and real impact for our clients.
            </p>
          </Reveal>
          <Stagger className="mt-14 grid gap-6 md:grid-cols-3" gap={0.1}>
            {culture.map((c) => (
              <StaggerItem key={c.title} className="h-full"><Card {...c} /></StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative w-full bg-[var(--hz-surface-2)] py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <h2 className="hz-display text-[2.25rem] text-[var(--hz-text)] sm:text-[3rem]">Benefits that have your back.</h2>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-[var(--hz-text-mute)]">
              A competitive package supporting the well-being and financial security of every team member.
            </p>
          </Reveal>
          <Stagger className="mt-14 grid gap-6 md:grid-cols-3" gap={0.1}>
            {benefits.map((b) => (
              <StaggerItem key={b.title} className="h-full"><Card {...b} /></StaggerItem>
            ))}
          </Stagger>

          <Reveal>
            <div className="mt-12 rounded-2xl border border-black/[0.08] bg-white p-8 text-center sm:p-10">
              <h3 className="hz-display text-[1.4rem] text-[var(--hz-text)] sm:text-[1.75rem]">An equal opportunity employer</h3>
              <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--hz-text-mute)]">
                We celebrate diversity and are committed to an inclusive environment for all. We do not discriminate based on
                race, color, religion, sex, sexual orientation, gender identity, national origin, disability, or veteran status.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate w-full overflow-hidden" style={{ background: "#07142b" }}>
        <Photo src={IMG.cta} className="z-0" fallback="linear-gradient(135deg, #0e2147 0%, #07142b 100%)" />
        <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(5,12,28,0.9) 0%, rgba(7,20,43,0.84) 100%), radial-gradient(60% 80% at 50% 0%, rgba(29,78,216,0.4), transparent 60%)" }} />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center sm:px-8 sm:py-32">
          <Reveal className="flex flex-col items-center">
            <h2 className="hz-display max-w-[16ch] text-[2.25rem] text-white sm:text-[3rem]">Ready to join our team?</h2>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/70 sm:text-[17px]">
              We&apos;re always looking for talented people to help us drive innovation and impact.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Cta href="/careers/search" variant="primary" icon={ArrowRight}>View open positions</Cta>
              <Cta href="/contact" variant="ghostDark">Get in touch</Cta>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
