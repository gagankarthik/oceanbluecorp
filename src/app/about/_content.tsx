"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  Target, Award, Cpu, Shield, MessageSquare, Users, Building2,
  CheckCircle2, Briefcase, Heart, ArrowRight, type LucideIcon,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Eyebrow, Cta } from "@/components/landing/ui";
import Photo from "@/components/landing/Photo";
import { IMG } from "@/components/landing/media";

const approach: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: Target, title: "Outcome-first", description: "We focus on business impact, not buzzwords." },
  { icon: Award, title: "Expert-led execution", description: "Senior-level talent drives every engagement." },
  { icon: Cpu, title: "AI-enabled by default", description: "We use intelligent tools and automation to accelerate results." },
  { icon: Shield, title: "Security at the core", description: "Every solution is built with compliance and protection in mind." },
  { icon: MessageSquare, title: "Human-centered delivery", description: "Clear communication, collaborative execution, no surprises." },
];

const differentiators: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: Users, title: "Specialized talent", description: "Highly skilled IT professionals who integrate seamlessly into your teams." },
  { icon: Building2, title: "Enterprise-grade solutions", description: "From cloud to ERP to AI, we deliver technology that scales." },
  { icon: CheckCircle2, title: "Proven delivery", description: "We execute with precision, transparency, and accountability." },
  { icon: Briefcase, title: "Industry expertise", description: "Healthcare, government, financial services, manufacturing, retail, technology." },
  { icon: Heart, title: "Long-term partnership", description: "We don't just deliver projects — we support your evolution." },
];

const milestones = [
  { year: "2013", title: "Foundation", description: "Ocean Blue founded with a vision to transform enterprise IT." },
  { year: "2015", title: "First prime-vendor MSA", description: "Established our first Master Service Agreement with a prime vendor." },
  { year: "2021", title: "Fortune 500 MSA", description: "Secured an MSA with a Fortune 500 enterprise client." },
  { year: "2022", title: "Expansion to India", description: "Opened a new delivery center with local operations." },
  { year: "2024", title: "Offices in the UK", description: "Strengthened European presence and client services." },
  { year: "2025", title: "AI practice launch", description: "Launched a dedicated AI practice for production deployments." },
];

function ValueCard({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="hz-card h-full p-7">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
        <Icon className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <h3 className="hz-display mt-6 text-[1.25rem] text-[var(--hz-text)]">{title}</h3>
      <p className="mt-3 text-[14px] leading-relaxed text-[var(--hz-text-mute)]">{description}</p>
    </div>
  );
}

/* Roadmap — a winding road through 6 evenly-spaced points, alternating up/down. */
const ROAD =
  "M100,168 C200,168 200,312 300,312 C400,312 400,168 500,168 C600,168 600,312 700,312 C800,312 800,168 900,168 C1000,168 1000,312 1100,312";
const NODES = [
  { x: 8.33, y: 35, above: true },
  { x: 25, y: 65, above: false },
  { x: 41.67, y: 35, above: true },
  { x: 58.33, y: 65, above: false },
  { x: 75, y: 35, above: true },
  { x: 91.67, y: 65, above: false },
];
const COLORS = ["#2563eb", "#06b6d4", "#6366f1", "#0ea5e9", "#14b8a6", "#8b5cf6"];

function MobileRoadmap() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 60%"] });
  const draw = useSpring(scrollYProgress, { stiffness: 80, damping: 28 });
  return (
    <div ref={ref} className="relative pl-16 lg:hidden">
      <div className="absolute left-[19px] top-1 bottom-1 w-[3px] rounded bg-black/[0.08]" />
      <motion.div className="absolute left-[19px] top-1 bottom-1 w-[3px] origin-top rounded bg-[var(--hz-cobalt)]" style={{ scaleY: draw }} />
      <div className="flex flex-col gap-10">
        {milestones.map((m, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <Reveal key={m.year} y={22}>
              <div className="relative">
                <motion.span
                  className="absolute -left-16 top-0 grid h-10 w-10 place-items-center rounded-full text-[13px] font-semibold text-white"
                  style={{ background: color, boxShadow: `0 0 0 5px var(--hz-canvas), 0 8px 18px -6px ${color}` }}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, margin: "-12% 0px" }}
                  transition={{ type: "spring", stiffness: 320, damping: 16 }}
                >
                  {i + 1}
                </motion.span>
                <span className="hz-display hz-tnum text-[1.4rem]" style={{ color }}>{m.year}</span>
                <h3 className="hz-display mt-1 text-[1.2rem] text-[var(--hz-text)]">{m.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--hz-text-mute)]">{m.description}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

function JourneyTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 65%"] });
  const draw = useSpring(scrollYProgress, { stiffness: 70, damping: 26 });

  return (
    <div className="mt-16">
      {/* Desktop winding roadmap */}
      <div ref={ref} className="relative hidden h-[480px] w-full lg:block">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1200 480" preserveAspectRatio="none" fill="none" aria-hidden>
          <defs>
            <linearGradient id="roadgrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <path d={ROAD} stroke="rgba(15,23,42,0.08)" strokeWidth={10} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <motion.path d={ROAD} stroke="url(#roadgrad)" strokeWidth={5} strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ pathLength: draw }} />
        </svg>

        {milestones.map((m, i) => {
          const n = NODES[i];
          const color = COLORS[i % COLORS.length];
          return (
            <div key={m.year}>
              <div
                className="absolute z-0 w-[2px] -translate-x-1/2"
                style={{ left: `${n.x}%`, top: n.above ? `calc(${n.y}% - 36px)` : `${n.y}%`, height: 36, background: color, opacity: 0.35 }}
              />
              <motion.div
                className="absolute z-10 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[15px] font-semibold text-white"
                style={{ left: `${n.x}%`, top: `${n.y}%`, background: color, boxShadow: `0 10px 22px -8px ${color}` }}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: "-8% 0px" }}
                transition={{ type: "spring", stiffness: 320, damping: 16, delay: i * 0.06 }}
              >
                {i + 1}
              </motion.div>
              <div
                className="absolute w-40"
                style={{ left: `${n.x}%`, top: `${n.y}%`, transform: `translate(-50%, ${n.above ? "calc(-100% - 38px)" : "38px"})` }}
              >
                <motion.div
                  initial={{ opacity: 0, y: n.above ? -8 : 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-8% 0px" }}
                  transition={{ duration: 0.5, delay: i * 0.06 + 0.12 }}
                  className="rounded-2xl border border-black/[0.06] bg-white p-4 text-center shadow-[var(--hz-shadow-md)]"
                >
                  <span className="hz-display hz-tnum text-[1.15rem]" style={{ color }}>{m.year}</span>
                  <h3 className="hz-display mt-1 text-[0.95rem] leading-tight text-[var(--hz-text)]">{m.title}</h3>
                  <p className="mt-1.5 text-[11.5px] leading-snug text-[var(--hz-text-mute)]">{m.description}</p>
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>

      <MobileRoadmap />
    </div>
  );
}

export default function AboutPage({ content = {} }: { content?: Record<string, string> }) {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      {/* Hero */}
      <section className="relative isolate flex min-h-[62vh] w-full items-center overflow-hidden" style={{ background: "#07142b" }}>
        <Photo src={IMG.aboutHero} className="z-0" fallback="linear-gradient(135deg, #0e2147 0%, #07142b 100%)" />
        <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(100deg, rgba(5,12,28,0.95) 0%, rgba(7,20,43,0.86) 38%, rgba(7,20,43,0.5) 72%, rgba(7,20,43,0.3) 100%)" }} />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-32 pb-20 sm:px-8">
          <Reveal>
            <Eyebrow tone="dark">About Ocean Blue</Eyebrow>
            <h1 className="hz-display mt-7 max-w-[20ch] text-[2.5rem] text-white sm:text-[3.25rem] lg:text-[4rem]">
              {content.aboutTitle || "We build the technology and teams that move organizations forward."}
            </h1>
            <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-white/75 sm:text-[18px]">
              {content.aboutSubtitle ||
                "A trusted partner for IT staffing, enterprise solutions, and digital transformation — delivering clarity, expertise, and measurable results."}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Story + Purpose */}
      <section className="relative w-full py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 sm:px-8 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div className="relative aspect-[5/4] w-full overflow-hidden rounded-3xl">
              <Photo src={IMG.aboutTeam} alt="The Ocean Blue team" />
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <Eyebrow>Who we are</Eyebrow>
            <blockquote className="hz-display mt-6 text-[1.6rem] leading-snug text-[var(--hz-text)] sm:text-[2rem]">
              “Technology should empower people, not complicate their work.”
            </blockquote>
            <p className="mt-6 text-[15px] leading-relaxed text-[var(--hz-text-mute)]">
              We help organizations modernize systems, strengthen teams, and adopt the
              technologies that drive real business impact — with a human-centered
              approach that values clarity, collaboration, and execution.
            </p>
            <div className="mt-8 border-t border-black/[0.08] pt-8">
              <Eyebrow>Why we exist</Eyebrow>
              <p className="mt-5 text-[15px] leading-relaxed text-[var(--hz-text-mute)]">
                To give organizations the technology, talent, and support they need to
                operate smarter, faster, and more securely — combining deep technical
                expertise with a genuine commitment to service.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How we work */}
      <section className="relative w-full bg-[var(--hz-surface-2)] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <Eyebrow>How we work</Eyebrow>
            <h2 className="hz-display mt-6 text-[2.25rem] text-[var(--hz-text)] sm:text-[3rem]">Principles we hold to.</h2>
          </Reveal>
          <Stagger className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" gap={0.08}>
            {approach.map((a) => (
              <StaggerItem key={a.title} className="h-full"><ValueCard {...a} /></StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Milestones */}
      <section className="relative w-full py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <Eyebrow>Our journey</Eyebrow>
            <h2 className="hz-display mt-6 text-[2.25rem] text-[var(--hz-text)] sm:text-[3rem]">Milestones that define us.</h2>
          </Reveal>
          <JourneyTimeline />
        </div>
      </section>

      {/* What sets us apart */}
      <section className="relative w-full bg-[var(--hz-surface-2)] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <Eyebrow>What sets us apart</Eyebrow>
            <h2 className="hz-display mt-6 text-[2.25rem] text-[var(--hz-text)] sm:text-[3rem]">A partner you can trust.</h2>
          </Reveal>
          <Stagger className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" gap={0.08}>
            {differentiators.map((d) => (
              <StaggerItem key={d.title} className="h-full"><ValueCard {...d} /></StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Team teaser → /team */}
      <section className="relative w-full py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal>
            <div className="flex flex-col items-start gap-7 rounded-3xl bg-[var(--hz-surface-2)] p-10 sm:flex-row sm:items-center sm:justify-between sm:p-14">
              <div className="max-w-xl">
                <Eyebrow>Our team</Eyebrow>
                <h2 className="hz-display mt-5 text-[1.9rem] text-[var(--hz-text)] sm:text-[2.4rem]">
                  Senior practitioners who lead from the front.
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-[var(--hz-text-mute)]">
                  Meet the leadership and the delivery bench behind every engagement.
                </p>
              </div>
              <Cta href="/team" variant="primary" icon={ArrowRight}>Meet the team</Cta>
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
            <Eyebrow tone="dark">Let&apos;s talk</Eyebrow>
            <h2 className="hz-display mt-7 max-w-[16ch] text-[2.25rem] text-white sm:text-[3rem]">Work with a team that owns the outcome.</h2>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Cta href="/contact" variant="primary" icon={ArrowRight}>Start a conversation</Cta>
              <Cta href="/services" variant="ghostDark">Explore services</Cta>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
