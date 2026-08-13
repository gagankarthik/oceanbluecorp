"use client";

import Image from "next/image";

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
  // `dark` exists only for the near-white wordmark that would otherwise be
  // invisible on the white background.
  const cls = `h-7 w-auto max-w-full object-contain sm:h-8${l.dark ? " brightness-0" : ""}`;
  // `min(...)` rather than a flat cap: the intrinsic width is the ceiling, but
  // in a six-across row the cell is narrower than that on most viewports.
  const capped = { maxWidth: `min(${l.w}px, 100%)` };
  return (
    <div className="flex w-full items-center justify-center">
      {l.remote ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={l.logo} alt={l.name} width={l.w} height={36} loading="lazy" decoding="async" className={cls} style={capped} />
      ) : (
        <Image src={l.logo} alt={l.name} width={l.w} height={36} className={cls} style={capped} />
      )}
    </div>
  );
}

/**
 * The client logo row, rendered inside Credentials beside its heading.
 *
 * One row of six at lg, where the marks read as a single line of proof.
 * Below that they wrap to 3 and then 2 per row, since six across a phone
 * would shrink every mark past legibility.
 */
export function ClientRow() {
  return (
    <ul className="grid grid-cols-2 items-center gap-x-8 gap-y-10 sm:grid-cols-3 sm:gap-x-10 lg:grid-cols-6 lg:gap-x-8 lg:gap-y-0">
      {clients.map((l) => (
        <li key={l.name} className="flex items-center justify-center">
          <LogoMark l={l} />
        </li>
      ))}
    </ul>
  );
}
