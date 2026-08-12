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

/**
 * The client logo row, with no section around it.
 *
 * Rendered inside Credentials, which pairs it with the accreditation row
 * behind a pair of tabs — clients and certifications are both answers to the
 * same question ("who vouches for you?"), and giving each its own full-width
 * band said it twice.
 *
 * Four across, so six logos land as 4 + 2 rather than a single thin line of
 * six. Spread over the full page width the row read as six unrelated marks
 * with too much air between them; a capped, four-column block reads as a set.
 *
 * The nth-child(5) offset centres that second row. Without it the last two sit
 * in columns one and two with the right half of the row empty, which reads as
 * a layout that ran out rather than a deliberate 4 + 2.
 *
 * A static row, not a marquee: the scrolling version repeated this set every
 * ~1200px against a wider viewport, so two and sometimes three copies of the
 * same logo were on screen at once, which reads as padding a short client list
 * rather than showing a real one.
 */
export function ClientRow() {
  return (
    <ul className="mx-auto grid max-w-5xl grid-cols-2 items-center gap-x-10 gap-y-12 sm:grid-cols-4 sm:gap-x-14 sm:[&>li:nth-child(5)]:col-start-2">
      {clients.map((l) => (
        <li key={l.name} className="flex items-center justify-center">
          <LogoMark l={l} />
        </li>
      ))}
    </ul>
  );
}
