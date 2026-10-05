"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/* Client marks for the home page strip. */

type Logo = { name: string; src: string; w: number; remote?: boolean; dark?: boolean };

const LOGOS: Logo[] = [
  // Self-hosted: development.ohio.gov's WAF refuses requests without a browser UA.
  { name: "Ohio Department of Development", src: "/logos/clients/ohio-development.png", w: 132 },
  { name: "HGS", src: "/logos/clients/hgs.svg", w: 104 },
  { name: "Diebold Nixdorf", src: "https://www.dieboldnixdorf.com/-/media/diebold/images/global/logo/dn-color-logo.svg", w: 150, remote: true },
  {
    name: "Satya Wholesalers",
    src: "https://www.satyawholesalers.com/_next/image?url=https%3A%2F%2Fsatyawholesalers.net%2Fstorage%2F3288%2Fsatya-wholesale-logo-(1).png&w=1920&q=75",
    w: 130,
    remote: true,
  },
  { name: "City Barbeque", src: "/logos/clients/citybarbeque.svg", w: 128 },
  // A near-white wordmark: forced to ink so it reads on white.
  { name: "Condado Tacos & Tequila", src: "/logos/clients/tacos.webp", w: 150, dark: true },
];

function Mark({ l, hidden }: { l: Logo; hidden: boolean }) {
  // Brand colours as supplied; only the near-white wordmark is darkened, or it vanishes on white.
  const cls = `h-8 w-auto object-contain ${l.dark ? "brightness-0" : ""}`;
  const alt = hidden ? "" : l.name;
  // Remote SVG stays on <img>: next/image refuses SVG without dangerouslyAllowSVG.
  if (l.remote && /\.svg(\?|$)/i.test(l.src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={l.src} alt={alt} width={l.w} height={32} loading="lazy" decoding="async" className={cls} style={{ maxWidth: l.w }} />;
  }
  return <Image src={l.src} alt={alt} width={l.w} height={32} sizes={`${l.w}px`} className={cls} style={{ maxWidth: l.w }} />;
}

const CELLS = 4;
const STAGGER = 110; // ms between boxes, left to right

/** The client strip: a label on the left, then four fixed boxes. Every few
 *  seconds all four move to the next set of clients together, the change
 *  sweeping left to right. Holds still on hover and under reduced motion. */
export function CustomerMarquee({ label }: { label: string }) {
  // `set` counts rotations; box i shows client (set * CELLS + i) mod the list.
  const [set, setSet] = useState(0);
  const hover = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!hover.current) setSet((n) => n + 1);
    }, 3600);
    return () => window.clearInterval(id);
  }, []);

  const at = (n: number, i: number) => (n * CELLS + i) % LOGOS.length;

  return (
    <div data-tone="white" className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1240px] flex-col sm:px-6 lg:flex-row">
        <p className="border-b border-line px-4 py-5 text-[15px] leading-snug text-ink sm:px-0 lg:flex lg:w-[250px] lg:shrink-0 lg:items-center lg:border-r lg:border-b-0 lg:pr-8">
          {label}
        </p>
        <ul
          aria-label="Clients"
          onMouseEnter={() => (hover.current = true)}
          onMouseLeave={() => (hover.current = false)}
          className="grid flex-1 grid-cols-2 sm:grid-cols-4"
        >
          {Array.from({ length: CELLS }, (_, i) => (
            <li
              key={i}
              className={`group relative h-24 overflow-hidden border-line [perspective:600px] transition-colors duration-300 hover:bg-paper sm:h-28 ${i % 2 === 0 ? "border-r" : i < CELLS - 1 ? "sm:border-r" : ""} ${i < 2 ? "border-b sm:border-b-0" : ""}`}
            >
              {set > 0 && (
                <span
                  key={`out-${set}`}
                  aria-hidden
                  className="logo-out absolute inset-0 flex items-center justify-center px-5"
                  style={{ animationDelay: `${i * STAGGER}ms` }}
                >
                  <Mark l={LOGOS[at(set - 1, i)]} hidden />
                </span>
              )}
              <span
                key={`in-${set}`}
                className={`absolute inset-0 flex items-center justify-center px-5 ${set > 0 ? "logo-in" : ""}`}
                style={set > 0 ? { animationDelay: `${i * STAGGER + 260}ms` } : undefined}
              >
                <span className="flex transition-transform duration-300 ease-[var(--ease-standard)] group-hover:scale-110">
                  <Mark l={LOGOS[at(set, i)]} hidden={false} />
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
