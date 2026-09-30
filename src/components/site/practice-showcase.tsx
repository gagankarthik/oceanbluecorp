"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Photo from "@/components/landing/Photo";
import { IMG } from "@/components/landing/media";
import { SectionLink } from "./sections";
import { cn } from "@/lib/utils";
import { PRACTICE_CARDS } from "./practice-cards";
import {
  IconArrowRight,
  IconChevronDown,
  IconGraduation,
  IconHardHat,
  IconLayers,
  IconServer,
  IconTalent,
  type Icon,
} from "./icons";

type Practice = {
  href: string;
  name: string;
  body: string;
  image: string;
  icon: Icon;
  offers: string[];
};

// Copy and `offers` match each practice page; practice-cards.tsx draws one card per offer.
const PRACTICES: Practice[] = [
  {
    href: "/solutions/staffing",
    name: "IT Staffing & Talent",
    body: "Vetted specialists who join your team and carry the work, on flexible or permanent terms.",
    image: IMG.serviceTalent,
    icon: IconTalent,
    offers: ["Cloud, data & security engineers", "ERP & Salesforce specialists", "AI/ML engineers", "Project & program managers"],
  },
  {
    href: "/solutions/engineering",
    name: "Engineering Talent",
    body: "Mechanical, electrical, aerospace and controls engineers, on your program.",
    image: IMG.serviceEngineering,
    icon: IconHardHat,
    offers: ["Mechanical", "Electrical & Electronics", "Aerospace", "Controls & Automation"],
  },
  {
    href: "/solutions",
    name: "Enterprise Solutions",
    body: "Cloud, security, ERP, Salesforce and production AI, shipped without stopping the business.",
    image: IMG.serviceSolutions,
    icon: IconLayers,
    offers: ["Cloud engineering", "Cybersecurity", "ERP & Salesforce", "Production AI"],
  },
  {
    href: "/solutions/managed",
    name: "Managed Services",
    body: "Monitoring, support and tuning around the clock, on one accountable SLA.",
    image: IMG.serviceManaged,
    icon: IconServer,
    offers: ["24/7 monitoring & response", "Helpdesk & application support", "Cloud & infrastructure management", "Quarterly business reviews"],
  },
  {
    href: "/solutions/training",
    name: "Training & Upskilling",
    body: "Instructor-led training on the platforms your teams run, taught by practitioners.",
    image: IMG.serviceTraining,
    icon: IconGraduation,
    offers: ["Cloud & DevOps", "Data, analytics & AI", "ERP & Salesforce enablement", "Certification preparation"],
  },
];

// Canvas: one column of cards per practice, columns staggered vertically as
// on clerk.com. The canvas glides so the active card sits in the centre.
const CARD_W = 300;
const COL_GAP = 24;
const COL_OFFSET = [40, 0, 90, 20, 70];
const STEP_MS = 3400;

/**
 * The five practices, after clerk.com's components section. Desktop: an
 * accordion on the left; on the right a canvas with a card per offer that
 * glides to centre the selected one. It hops between random offers on its
 * own until the visitor takes over. Below lg: a swipeable row of cards.
 */
export function PracticeShowcase() {
  const [{ active, offer }, setPos] = useState({ active: 0, offer: 0 });
  const [auto, setAuto] = useState(true);
  const hover = useRef(false);
  const canvas = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);

  // Centre the active card: translate the canvas by the card's own centre.
  useEffect(() => {
    const el = cards.current[active * 4 + offer];
    if (!el || !canvas.current) return;
    const x = el.offsetLeft + el.offsetWidth / 2;
    const y = el.offsetTop + el.offsetHeight / 2;
    canvas.current.style.transform = `translate(${-x}px, ${-y}px)`;
  }, [active, offer]);

  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (hover.current) return;
      // A random card each step, never the one already showing.
      setPos((cur) => {
        let next = cur;
        while (next.active === cur.active && next.offer === cur.offer) {
          next = { active: Math.floor(Math.random() * PRACTICES.length), offer: Math.floor(Math.random() * 4) };
        }
        return next;
      });
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [auto]);

  const open = (i: number) => {
    setAuto(false);
    setPos({ active: i, offer: 0 });
  };

  return (
    <>
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-10" onMouseEnter={() => (hover.current = true)} onMouseLeave={() => (hover.current = false)}>
        <div className="lg:col-span-5">
          <ul className="border-t border-line">
            {PRACTICES.map((p, i) => {
              const on = i === active;
              return (
                <li key={p.name} className="border-b border-line">
                  <button
                    type="button"
                    aria-expanded={on}
                    aria-controls={`practice-${i}`}
                    onClick={() => open(i)}
                    className="flex w-full items-center gap-4 py-5 text-left"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "size-3 shrink-0 rounded-full border-2 transition-colors duration-300",
                        on ? "border-cobalt bg-cobalt" : "border-line-strong bg-transparent",
                      )}
                    />
                    <span className={cn("flex-1 text-[14px] font-semibold tracking-[0.08em] uppercase transition-colors", on ? "text-ink" : "text-ink-muted")}>
                      {p.name}
                    </span>
                    <IconChevronDown size={16} className={cn("text-ink-subtle transition-transform duration-300", on && "rotate-180")} />
                  </button>
                  <div
                    id={`practice-${i}`}
                    className={cn(
                      "grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-standard)]",
                      on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="pb-6 pl-7">
                        <p className="type-body-sm text-ink-muted">{p.body}</p>
                        <ul className="mt-4 space-y-1">
                          {p.offers.map((o, j) => (
                            <li key={o}>
                              <button
                                type="button"
                                tabIndex={on ? 0 : -1}
                                onClick={() => {
                                  setAuto(false);
                                  setPos({ active: i, offer: j });
                                }}
                                className={cn(
                                  "py-1.5 text-left text-[14.5px] font-medium transition-colors",
                                  on && j === offer ? "text-cobalt" : "text-ink hover:text-cobalt",
                                )}
                              >
                                {o}
                              </button>
                            </li>
                          ))}
                        </ul>
                        <SectionLink href={p.href} className="mt-5">
                          Explore {p.name}
                        </SectionLink>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* The canvas. Decorative: the accordion carries the same content. */}
        <div
          aria-hidden
          className="relative h-[620px] overflow-hidden lg:col-span-7 [mask-image:radial-gradient(70%_70%_at_50%_50%,black_45%,transparent_100%)]"
        >
          <div
            ref={canvas}
            className="absolute top-1/2 left-1/2 flex items-start transition-transform duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ gap: COL_GAP }}
          >
            {PRACTICE_CARDS.map((col, i) => (
              <div key={i} className="flex flex-col gap-6" style={{ width: CARD_W, paddingTop: COL_OFFSET[i] }}>
                {col.map((Card, j) => {
                  const on = i === active && j === offer;
                  return (
                    <div
                      key={j}
                      ref={(el) => {
                        cards.current[i * 4 + j] = el;
                      }}
                      className={cn(
                        "transition-[opacity,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        on ? "opacity-100 shadow-[var(--shadow-modal)] delay-300" : "opacity-30",
                      )}
                    >
                      <Card on={on} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:hidden">
        {PRACTICES.map((p) => (
          <li key={p.name} className="w-[85%] shrink-0 snap-start sm:w-[46%]">
            <Link href={p.href} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-paper-deep">
                <Photo src={p.image} sizes="(min-width: 640px) 46vw, 85vw" />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cobalt-tint text-cobalt">
                    <p.icon size={18} />
                  </span>
                  <h3 className="type-title text-ink">{p.name}</h3>
                </div>
                <p className="mt-3 type-body-sm text-ink-muted">{p.body}</p>
                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {p.offers.map((o) => (
                    <li key={o} className="rounded-full bg-paper px-3 py-1 text-[12.5px] text-ink-muted">
                      {o}
                    </li>
                  ))}
                </ul>
                <span className="mt-auto inline-flex items-center gap-2 pt-6 text-[15px] font-semibold text-ink group-hover:text-cobalt">
                  Learn more
                  <IconArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
