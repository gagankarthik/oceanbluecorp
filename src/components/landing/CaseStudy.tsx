"use client";

import { ArrowRight } from "lucide-react";
import { Reveal, Parallax } from "./motion/Primitives";
import Photo from "./Photo";
import { IMG } from "./media";

const facts = [
  { k: "Sector", v: "Banking & retail technology" },
  { k: "Engagement", v: "Specialist resources, on deadline" },
  { k: "Footprint", v: "Global enterprise programs" },
];

export default function CaseStudy() {
  return (
    <section className="relative w-full overflow-hidden bg-[var(--hz-canvas)] py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 sm:px-8 lg:grid-cols-2 lg:gap-16">
        {/* Image */}
        <Reveal>
          <Parallax distance={36}>
            <div className="relative aspect-[5/4] w-full overflow-hidden rounded-3xl">
              <Photo src={IMG.caseStudy} alt="Enterprise technology delivery" />
              <div className="absolute bottom-5 left-5 z-10 inline-flex items-center rounded-lg bg-white px-4 py-2.5 shadow-[var(--hz-shadow-md)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://www.dieboldnixdorf.com/-/media/diebold/images/global/logo/dn-color-logo.svg"
                  alt="Diebold Nixdorf"
                  className="h-5 w-auto"
                />
              </div>
            </div>
          </Parallax>
        </Reveal>

        {/* Story */}
        <Reveal delay={0.08}>
          <blockquote className="hz-display text-[1.6rem] font-medium leading-[1.3] text-[var(--hz-text)] sm:text-[2.1rem]">
            “OceanBlue resources demonstrated high levels of skill and
            professionalism, delivering quality results that met our expectations
            and deadlines.”
          </blockquote>
          <figcaption className="mt-6 text-[14px] text-[var(--hz-text-mute)]">
            <span className="font-semibold text-[var(--hz-text)]">Damodar Buchi Reddy</span> · Project Director, Diebold Nixdorf
          </figcaption>

          <dl className="mt-10 grid grid-cols-1 gap-x-8 gap-y-5 border-t border-black/[0.08] pt-8 sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.k}>
                <dt className="hz-eyebrow text-[var(--hz-amber)]">{f.k}</dt>
                <dd className="mt-2 text-[14px] font-medium text-[var(--hz-text)]">{f.v}</dd>
              </div>
            ))}
          </dl>

          <a href="/resources/case-studies" className="group mt-9 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--hz-cobalt)]">
            Read client stories
            <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1" strokeWidth={1.75} />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
