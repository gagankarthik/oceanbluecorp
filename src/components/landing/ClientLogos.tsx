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
  // Asset is a near-white wordmark, so render it dark on the white background.
  { name: "Condado Tacos & Tequila", logo: "/logos/clients/tacos.webp", w: 150, dark: true },
];

function LogoMark({ l }: { l: Logo }) {
  // Full-colour logos, no hover fade. `dark` is kept only for the near-white
  // wordmark that would otherwise be invisible on the white background.
  const cls = `h-7 w-auto object-contain sm:h-8${l.dark ? " brightness-0" : ""}`;
  return (
    <div className="flex items-center justify-center">
      {l.remote ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={l.logo} alt={l.name} width={l.w} height={36} loading="lazy" decoding="async" className={cls} style={{ maxWidth: l.w }} />
      ) : (
        <Image src={l.logo} alt={l.name} width={l.w} height={36} className={cls} />
      )}
    </div>
  );
}

export default function ClientLogos() {
  return (
    // Asymmetric padding on purpose. Symmetric py- on neighbouring sections
    // compounds: this section's 96px foot met Services' 128px head and put
    // ~220px of empty canvas between a logo row and the next heading, which
    // reads as a missing section rather than as breathing room. The logos
    // belong closer to what follows them than to the hero above.
    <section className="relative w-full overflow-hidden bg-[var(--hz-paper)] pt-16 pb-10 sm:pt-20 sm:pb-12 lg:pt-24 lg:pb-14">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <Reveal className="flex flex-col items-center gap-4 text-center">
          <span className="hz-eyebrow text-[var(--hz-amber)]">Selected clients</span>
          <h2 className="hz-display hz-statement max-w-2xl text-[var(--hz-text)]">
            Relied on by enterprises and state government agencies across North America.
          </h2>
        </Reveal>
      </div>

      {/* A static row, not a marquee. The scrolling version repeated this set
          every ~1200px against a wider viewport, so two and sometimes three
          copies of the same logo were on screen at once — which reads as
          padding a short client list rather than showing a real one. Six
          genuine enterprise logos are stronger standing still. */}
      <div className="mx-auto mt-10 max-w-6xl px-6 sm:mt-14 sm:px-8">
        <Reveal>
          <ul className="grid grid-cols-2 items-center gap-x-8 gap-y-10 sm:grid-cols-3 sm:gap-x-10 lg:grid-cols-6 lg:gap-x-6">
            {clients.map((l) => (
              <li key={l.name} className="flex items-center justify-center">
                <LogoMark l={l} />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

