"use client";

import Image from "next/image";
import { Reveal } from "./motion/Primitives";

const certs = [
  { name: "NMSDC", logo: "/logos/certifications/NMSDC.png" },
  { name: "Ohio WBE", logo: "/logos/certifications/wbe.png" },
  { name: "Ohio MBE", logo: "/logos/certifications/ohiombe.png" },
  { name: "MBE", logo: "/logos/certifications/mbe.png" },
];

export default function Certifications() {
  return (
    // White, sitting between the two tinted bands (stats above, testimonials
    // below) so the page alternates cleanly instead of running one long tint.
    <section className="relative w-full bg-[var(--hz-canvas)] py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <Reveal className="flex flex-col items-center gap-7 text-center sm:gap-8">
          <p className="hz-eyebrow text-[var(--hz-text-subtle)]">
            A certified minority- and women-owned business
          </p>
          {/* These are four raw vendor files — a blue hexagon, two red-and-blue
              Ohio script badges, a solid MBE rectangle — at four different
              shapes and saturations. Loose on white they were the loudest thing
              on an otherwise restrained page. Equal neutral tiles give them one
              shared frame, and resting desaturated (full colour on hover) lets
              the credential read as prestige rather than clip art. */}
          <ul className="grid w-full grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {certs.map((c) => (
              <li
                key={c.name}
                className="group flex items-center justify-center rounded-xl border border-black/[0.06] bg-[var(--hz-band)] px-6 py-7 transition-colors duration-300 hover:border-black/[0.1] hover:bg-white"
              >
                <div className="relative h-12 w-24 sm:h-14 sm:w-28">
                  <Image
                    src={c.logo}
                    alt={`${c.name} certification`}
                    fill
                    className="object-contain opacity-75 saturate-0 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100 group-hover:saturate-100"
                    sizes="(max-width: 640px) 96px, 112px"
                  />
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
