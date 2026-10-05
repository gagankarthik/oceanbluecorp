"use client";

import { useState } from "react";
import OfficeMap from "./OfficeMap";
import { SectionTitle, CONTAINER, SECTION_Y } from "@/components/site/sections";
import { cn } from "@/lib/utils";

/* ============================================================
   Where we are.

   The map is a picture, the card and the list are the content.
   Clicking a pin swaps the card; the card is real text in the DOM
   at all times, and on phones the full address list sits below the
   map, so everything the map gestures at is readable without it.

   The map itself is OfficeMap: OpenStreetMap tiles and Mercator
   arithmetic, no map library. See the note in that file.
   ============================================================ */

export type Office = {
  city: string;
  country: string;
  address: string;
  phone?: string;
  lat: number;
  lng: number;
  hq?: boolean;
};

export const OFFICES: Office[] = [
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
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export default function Locations({ tone = "paper" }: { tone?: "white" | "paper" }) {
  const [active, setActive] = useState(0);

  return (
    <section id="locations" data-tone={tone === "paper" ? "paper" : "white"} className={cn("w-full scroll-mt-28", tone === "paper" ? "bg-paper" : "bg-white", SECTION_Y)}>
      <div className={CONTAINER}>
        <SectionTitle
          title="Four offices, three countries, one team"
          sub="Ohio, Hyderabad, Vizianagaram and London. Enough overlap to hand work across the day, and someone awake when your systems are not."
        />

        <div className="reveal relative mt-10 w-full sm:mt-12 overflow-hidden rounded-2xl border border-line bg-white">
          {/* Hyderabad and Vizianagaram sit close together, so their cards
              lean apart: Hyderabad's to the left, Vizianagaram's to the right. */}
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
              align: o.city === "Hyderabad" ? ("right" as const) : o.city === "London" ? ("center" as const) : ("left" as const),
            }))}
          />
        </div>

        {/* The map's cards are hidden below `lg`, so the same content appears
            here instead. */}
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:hidden">
          {OFFICES.map((o) => (
            <li key={o.city} className="rounded-2xl border border-line bg-white p-5">
              <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                {o.city}
                {o.hq && <span className="rounded-full bg-cobalt-tint px-2 py-0.5 text-[11px] font-semibold text-cobalt">HQ</span>}
              </p>
              <p className="mt-0.5 text-[13px] text-ink-subtle">{o.country}</p>
              <address className="mt-2.5 text-[14px] leading-relaxed text-ink-muted not-italic">{o.address}</address>
              {o.phone && (
                <a href={telHref(o.phone)} className="mt-2.5 inline-block text-[14px] font-medium text-cobalt">
                  {o.phone}
                </a>
              )}
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-[15px] text-ink-muted">
          Or email{" "}
          <a href="mailto:hr@oceanbluecorp.com" className="font-semibold text-cobalt underline-offset-4 hover:underline">
            hr@oceanbluecorp.com
          </a>{" "}
          and it reaches all four.
        </p>
      </div>
    </section>
  );
}
