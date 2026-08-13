"use client";

import { useState } from "react";
import OfficeMap from "./OfficeMap";
import { Reveal } from "./motion/Primitives";

/* ============================================================
   Where we are.

   The map is a picture, the card and the list are the content.
   Clicking a pin swaps the card; the card is real text in the DOM
   at all times, and the full address list sits below the map, so
   everything the map gestures at is readable without it.

   The map itself is OfficeMap: OpenStreetMap tiles and Mercator
   arithmetic, no map library. See the note in that file for why
   maplibre came out.
   ============================================================ */


type Office = {
  city: string;
  country: string;
  address: string;
  phone?: string;
  lat: number;
  lng: number;
  hq?: boolean;
};

const OFFICES: Office[] = [
  {
    city: "Powell",
    country: "United States",
    address: "9775 Fairway Drive, Suite C, Powell, OH 43065",
    phone: "+1 (614) 844-6925",
    lat: 40.1573,
    lng: -83.0752,
    hq: true,
  },
  {
    city: "Hyderabad",
    country: "India",
    address: "13th Floor, Building 9, Raheja Mindspace, Madhapur, Hyderabad 560081",
    phone: "+91 814 312 4665",
    lat: 17.4483,
    lng: 78.3915,
  },
  {
    city: "Vizianagaram",
    country: "India",
    address: "Plot No. 87, CMR Green Field Layout, Vizianagaram, Andhra Pradesh 535004",
    phone: "+91 814 294 9111",
    lat: 18.1067,
    lng: 83.3956,
  },
  {
    city: "London",
    country: "United Kingdom",
    address: "910 London Road, Thornton Heath, CR7 7PE",
    lat: 51.398,
    lng: -0.1004,
  },
];

/** Digits only, so the tel: link dials correctly from a phone. */
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export default function Locations() {
  const [active, setActive] = useState(0);

  return (
    <section id="locations" className="w-full scroll-mt-24 bg-[var(--hz-ink)] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
        <Reveal className="max-w-2xl">
          <span className="hz-eyebrow block text-[var(--hz-cobalt-300)]">Where we are</span>
          <h2 className="hz-display hz-h2 mt-4 text-white">
            Four offices, three countries, one team.
          </h2>
          <p className="mt-5 max-w-[54ch] text-[16px] leading-relaxed text-white/70 sm:text-[17px]">
            Ohio, Hyderabad, Vizianagaram and London. Enough overlap to hand work
            across the day, and someone awake when your systems are not.
          </p>
        </Reveal>

        <div className="relative mt-12 w-full overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] sm:mt-14">
          {/* Hyderabad and Vizianagaram are about two percent apart on this
              crop, so their cards are staggered: one on a long stalk leaning
              left, the other on a short one leaning right. Without that they
              land on top of each other. */}
          <OfficeMap
            activeIndex={active}
            onSelect={setActive}
            points={OFFICES.map((o) => ({
              lat: o.lat,
              lng: o.lng,
              city: o.city,
              country: o.country,
              address: o.address,
              phone: o.phone,
              hq: o.hq,
              stalk: o.city === "Hyderabad" ? 116 : o.city === "Vizianagaram" ? 48 : 56,
              align:
                o.city === "Hyderabad"
                  ? ("right" as const)
                  : o.city === "Vizianagaram"
                    ? ("left" as const)
                    : ("center" as const),
            }))}
          />

        </div>

        {/* Phones only. The map's cards are hidden below `sm` because a
            210px card cannot sit beside its neighbour on a 350px map, so the
            same content appears here instead. On desktop this is absent: the
            cards on the map already say it, and repeating it underneath was
            the duplication asked to be removed. */}
        <ul className="mt-8 grid gap-4 sm:hidden">
          {OFFICES.map((o) => (
            <li key={o.city} className="rounded-xl border border-white/12 bg-white/[0.05] p-5">
              <p className="flex items-center gap-2 text-[15px] font-semibold text-white">
                {o.city}
                {o.hq && (
                  <span className="rounded-full bg-[var(--hz-cobalt)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
                    HQ
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-[12.5px] text-white/55">{o.country}</p>
              <address className="mt-2.5 not-italic text-[13px] leading-relaxed text-white/70">
                {o.address}
              </address>
              {o.phone && (
                <a href={telHref(o.phone)} className="mt-2.5 inline-block text-[13px] font-medium text-[var(--hz-cobalt-300)]">
                  {o.phone}
                </a>
              )}
            </li>
          ))}
        </ul>

        <p className="mt-10 text-[14.5px] text-white/70">
          Or email{" "}
          <a
            href="mailto:hr@oceanbluecorp.com"
            className="font-medium text-[var(--hz-cobalt-300)] transition-opacity hover:opacity-80"
          >
            hr@oceanbluecorp.com
          </a>
          {" "}and it reaches all four.
        </p>
      </div>
    </section>
  );
}
