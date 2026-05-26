"use client";

import Image from "next/image";
import { Reveal } from "./motion/Primitives";

type Logo = { name: string; logo: string; w: number; remote?: boolean; dark?: boolean };

const clients: Logo[] = [
  {
    name: "Ohio Development",
    logo: "https://development.ohio.gov/wps/wcm/connect/gov/7efff5ea-f9fd-4c0f-9a71-401183103f50/development-logo.png?MOD=AJPERES",
    w: 132,
    remote: true,
  },
  { name: "HGS", logo: "/logos/clients/hgs.svg", w: 104 },
  {
    name: "Diebold Nixdorf",
    logo: "https://www.dieboldnixdorf.com/-/media/diebold/images/global/logo/dn-color-logo.svg",
    w: 150,
    remote: true,
  },
  {
    name: "Satya Wholesalers",
    logo: "https://www.satyawholesalers.com/_next/image?url=https%3A%2F%2Fsatyawholesalers.net%2Fstorage%2F3288%2Fsatya-wholesale-logo-(1).png&w=1920&q=75",
    w: 130,
    remote: true,
  },
  { name: "City Barbeque", logo: "/logos/clients/citybarbeque.svg", w: 128 },
  // Asset is a near-white wordmark, so render it dark on the white marquee.
  { name: "Condado Tacos & Tequila", logo: "/logos/clients/tacos.webp", w: 150, dark: true },
];

// One marquee "half" — the set repeated so it comfortably exceeds the widest
// viewport (~3× ≈ 3000px). Rendering two identical halves and animating to
// -50% gives a seamless, gap-free loop on any screen width.
const HALF: Logo[] = [...clients, ...clients, ...clients];

function LogoMark({ l }: { l: Logo }) {
  const cls =
    `h-8 w-auto object-contain opacity-90 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-100${
      l.dark ? " brightness-0" : ""
    }`;
  return (
    <div className="flex shrink-0 items-center px-10" style={{ minWidth: l.w }}>
      {l.remote ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={l.logo} alt={l.name} className={cls} style={{ maxWidth: l.w }} />
      ) : (
        <Image src={l.logo} alt={l.name} width={l.w} height={36} className={cls} />
      )}
    </div>
  );
}

export default function ClientLogos() {
  return (
    <section className="relative w-full overflow-hidden bg-[var(--hz-canvas)] py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <Reveal className="flex flex-col items-center gap-5 text-center">
          <h2 className="hz-display max-w-2xl text-[1.7rem] text-[var(--hz-text)] sm:text-[2.1rem]">
            Relied on by enterprises and state government agencies across North America.
          </h2>
        </Reveal>
      </div>

      <div
        className="relative mt-16"
        style={{
          maskImage: "linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent)",
        }}
      >
        {/* Each half is the client set repeated enough to exceed any viewport, so
            the -50% loop never reveals a gap. Two identical halves = seamless. */}
        <div className="hz-marquee flex w-max items-center">
          {[...HALF, ...HALF].map((l, i) => (
            <LogoMark key={`${l.name}-${i}`} l={l} />
          ))}
        </div>
      </div>

    </section>
  );
}

