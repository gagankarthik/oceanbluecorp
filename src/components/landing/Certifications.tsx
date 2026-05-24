"use client";

import Image from "next/image";
import { Reveal } from "./motion/Primitives";

const certs = [
  { name: "NMSDC", logo: "/NMSDC.png" },
  { name: "Ohio WBE", logo: "/wbe.png" },
  { name: "Ohio MBE", logo: "/ohiombe.png" },
  { name: "MBE", logo: "/mbe.png" },
];

export default function Certifications() {
  return (
    <section className="relative w-full bg-[var(--hz-canvas)] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <Reveal className="flex flex-col items-center gap-8 text-center">
          <p className="text-[14px] text-[var(--hz-text-subtle)]">
            A certified minority- and women-owned business.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 sm:gap-x-16">
            {certs.map((c) => (
              <div key={c.name} className="relative h-14 w-24 sm:h-16 sm:w-28">
                <Image
                  src={c.logo}
                  alt={`${c.name} certification`}
                  fill
                  className="object-contain opacity-75 transition-opacity duration-300 hover:opacity-100"
                  sizes="120px"
                />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
