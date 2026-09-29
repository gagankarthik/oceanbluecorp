"use client";

import { useState } from "react";
import Image from "next/image";
import { IconPause, IconPlay } from "./icons";

/* Client marks as one quiet monochrome strip. Two copies make the loop
   seamless; the second is hidden from assistive tech. */

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

export function CustomerMarquee() {
  const [paused, setPaused] = useState(false);
  const row = [...LOGOS, ...LOGOS];
  return (
    <div className="relative">
      <div
        data-motion={paused ? "paused" : "running"}
        className="marquee-wrap relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
      >
        <ul className="marquee flex w-max items-center gap-16 py-2" aria-label="Clients">
          {row.map((l, i) => (
            <li key={i} aria-hidden={i >= LOGOS.length || undefined} className="group flex shrink-0 items-center">
              <Mark l={l} hidden={i >= LOGOS.length} />
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? "Play logo animation" : "Pause logo animation"}
        className="mx-auto mt-4 flex size-8 items-center justify-center rounded-full border border-line text-ink-subtle hover:border-ink-subtle hover:text-ink"
      >
        {paused ? <IconPlay size={12} /> : <IconPause size={12} />}
      </button>
    </div>
  );
}
