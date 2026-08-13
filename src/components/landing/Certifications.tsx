"use client";

import Image from "next/image";
import { Reveal } from "./motion/Primitives";

/* Intrinsic ratios here run from 1:1 to 4.18:1, which is why a single box
   size made these look mismatched: object-contain inside one frame lets the
   square badge fill the full height while the long horizontal lockups shrink
   to a third of it. Heights are set per badge so they carry comparable visual
   weight, the square one shorter than its box would allow, the wide ones
   taller. Width/height are the real pixel dimensions, so next/image keeps the
   aspect and only CSS scales them. */
const certs = [
  { name: "NMSDC",    logo: "/logos/certifications/NMSDC.png",    w: 340, h: 340, cls: "h-16 sm:h-20" },
  { name: "Ohio WBE", logo: "/logos/certifications/wbe.png",      w: 845, h: 202, cls: "h-11 sm:h-14" },
  { name: "Ohio MBE", logo: "/logos/certifications/ohiombe.png",  w: 734, h: 202, cls: "h-11 sm:h-14" },
  { name: "MBE",      logo: "/logos/certifications/mbe.png",      w: 707, h: 353, cls: "h-14 sm:h-16" },
];

/**
 * The accreditation row.
 *
 * No longer its own section. It was the thinnest band on the page, a label
 * and four badges between two tinted bands, and a page of eight short
 * sections reads as a list rather than an argument. It now sits inside the
 * Impact band, where it belongs: years delivering, clients, retention and
 * offices are proof, and so is being a certified MBE/WBE. One section makes
 * the whole case instead of two making half of it each.
 *
 * Exported as a bare row, not a <section>, the band around it owns the
 * background and the padding.
 */
export function CertificationRow() {
  return (
    <Reveal className="flex flex-col items-center gap-7 text-center sm:gap-8">
      <ul className="mx-auto grid max-w-5xl grid-cols-2 items-center gap-x-10 gap-y-12 sm:grid-cols-4 sm:gap-x-14">
        {certs.map((c) => (
          <li key={c.name} className="flex items-center justify-center">
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
  );
}
