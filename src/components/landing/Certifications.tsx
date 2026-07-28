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
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-7 sm:gap-x-16 sm:gap-y-8">
            {certs.map((c) => (
              <div
                key={c.name}
                className="relative h-14 w-20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105 sm:h-20 sm:w-32"
              >
                <Image
                  src={c.logo}
                  alt={`${c.name} certification`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 80px, 128px"
                />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
