"use client";

import Image from "next/image";
import { Reveal } from "./motion/Primitives";

/* Intrinsic ratios here run from 1:1 to 4.18:1, which is why a single box
   size made these look mismatched: object-contain inside one frame lets the
   square badge fill the full height while the long horizontal lockups shrink
   to a third of it. Heights are set per badge so they carry comparable visual
   weight — the square one shorter than its box would allow, the wide ones
   taller. Width/height are the real pixel dimensions, so next/image keeps the
   aspect and only CSS scales them. */
const certs = [
  { name: "NMSDC",    logo: "/logos/certifications/NMSDC.png",    w: 340, h: 340, cls: "h-16 sm:h-20" },
  { name: "Ohio WBE", logo: "/logos/certifications/wbe.png",      w: 845, h: 202, cls: "h-11 sm:h-14" },
  { name: "Ohio MBE", logo: "/logos/certifications/ohiombe.png",  w: 734, h: 202, cls: "h-11 sm:h-14" },
  { name: "MBE",      logo: "/logos/certifications/mbe.png",      w: 707, h: 353, cls: "h-14 sm:h-16" },
];

export default function Certifications() {
  return (
    // White, sitting between the two tinted bands (stats above, testimonials
    // below) so the page alternates cleanly instead of running one long tint.
    <section className="relative w-full bg-[var(--hz-paper)] py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <Reveal className="flex flex-col items-center gap-7 text-center sm:gap-8">
          <p className="hz-eyebrow text-[var(--hz-text-subtle)]">
            A certified minority- and women-owned business
          </p>
          {/* No frames and full colour: these are accreditations, and an MBE or
              WBE mark is recognised by its own colours. Boxing them in tiles
              made four credentials read as four UI cards, and desaturating
              them threw away the exact thing that identifies them. What they
              needed was consistent sizing, not containment. */}
          <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 sm:gap-x-16">
            {certs.map((c) => (
              <li key={c.name}>
                <Image
                  src={c.logo}
                  alt={`${c.name} certification`}
                  width={c.w}
                  height={c.h}
                  className={`${c.cls} w-auto object-contain transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.04]`}
                />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
