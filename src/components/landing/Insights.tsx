"use client";

import { ArrowUpRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./motion/Primitives";
import Photo from "./Photo";
import { IMG } from "./media";

type Insight = {
  category: string;
  title: string;
  read: string;
  img: string;
  href: string;
};

const insights: Insight[] = [
  {
    category: "Guide",
    title: "What a 48-hour candidate shortlist actually requires",
    read: "6 min read",
    img: IMG.insightHiring,
    href: "/resources/blog",
  },
  {
    category: "Field notes",
    title: "Migrating core systems without the downtime",
    read: "8 min read",
    img: IMG.insightCloud,
    href: "/resources/blog",
  },
  {
    category: "Playbook",
    title: "Running managed services against a single SLA",
    read: "5 min read",
    img: IMG.insightSupport,
    href: "/resources/blog",
  },
];

function InsightCard({ p }: { p: Insight }) {
  return (
    <a href={p.href} className="group flex h-full flex-col">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl">
        <Photo src={p.img} className="transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105" />
      </div>
      <div className="mt-5 flex items-center gap-3">
        <span className="hz-eyebrow text-[var(--hz-amber)]">{p.category}</span>
        <span className="h-3 w-px bg-black/15" />
        <span className="hz-eyebrow text-[var(--hz-text-subtle)]">{p.read}</span>
      </div>
      <h3 className="hz-display mt-3 text-[1.3rem] leading-snug text-[var(--hz-text)] transition-colors duration-300 group-hover:text-[var(--hz-cobalt)] sm:text-[1.5rem]">
        {p.title}
      </h3>
    </a>
  );
}

export default function Insights() {
  return (
    <section className="relative w-full bg-[var(--hz-ivory)] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="hz-display text-[2.25rem] text-[var(--hz-text)] sm:text-[3rem]">
              Insights from the field.
            </h2>
          </div>
          <a href="/resources/blog" className="group inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--hz-cobalt)]">
            View all insights
            <ArrowUpRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.75} />
          </a>
        </Reveal>

        <Stagger className="mt-14 grid gap-x-8 gap-y-12 md:grid-cols-3" gap={0.1}>
          {insights.map((p) => (
            <StaggerItem key={p.title} className="h-full">
              <InsightCard p={p} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
