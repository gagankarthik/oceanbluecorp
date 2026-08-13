"use client";

import { DottedMap } from "@/components/ui/dotted-map";
import { Reveal } from "./motion/Primitives";

/* ============================================================
   Where we are.

   The map is the illustration, not the data. It shows the SHAPE
   of the coverage at a glance, four pins across three countries
   and nine and a half time zones, which is the actual argument:
   there is someone awake when your system is not.

   The addresses underneath are the data, in text. That split is
   deliberate. A pin on a dotted world map is unreadable as an
   address and unusable by a screen reader, so nothing depends on
   it: the map can be ignored entirely and the section still works.

   Coordinates are for the office cities. They are used only to
   place a dot on a stylised map, so city-level precision is the
   right precision. Nothing here geocodes the street address.
   ============================================================ */

type Office = {
  city: string;
  country: string;
  flag?: string;
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
    flag: "🇺🇸",
    address: "9775 Fairway Drive, Suite C, Powell, OH 43065",
    phone: "+1 (614) 844-6925",
    lat: 40.1573,
    lng: -83.0752,
    hq: true,
  },
  {
    city: "Hyderabad",
    country: "India",
    flag: "🇮🇳",
    address: "13th Floor, Building 9, Raheja Mindspace, Madhapur, Hyderabad 560081",
    phone: "+91 814 312 4665",
    lat: 17.4483,
    lng: 78.3915,
  },
  {
    city: "Vizianagaram",
    country: "India",
    flag: "🇮🇳",
    address: "Plot No. 87, CMR Green Field Layout, Vizianagaram, Andhra Pradesh 535004",
    phone: "+91 814 294 9111",
    lat: 18.1067,
    lng: 83.3956,
  },
  {
    city: "London",
    country: "United Kingdom",
    flag: "🇬🇧",
    address: "910 London Road, Thornton Heath, CR7 7PE",
    lat: 51.398,
    lng: -0.1004,
  },
];

/** Digits only, so the tel: link dials correctly from a phone. */
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export default function Locations() {
  return (
    <section id="locations" className="w-full scroll-mt-24 bg-[var(--hz-paper)] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
        <Reveal className="max-w-2xl">
          <span className="hz-eyebrow block text-[var(--hz-cobalt)]">Where we are</span>
          <h2 className="hz-display hz-h2 mt-4 text-[var(--hz-text)]">
            Four offices, three countries, one team.
          </h2>
          <p className="mt-5 max-w-[54ch] text-[16px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[17px]">
            Ohio, Hyderabad, Vizianagaram and London. Enough overlap to hand work
            across the day, and someone awake when your systems are not.
          </p>
        </Reveal>

        {/* Decorative by design: the addresses below carry every fact this
            picture gestures at, so the map is hidden from assistive tech
            rather than described badly. */}
        <Reveal delay={0.06} className="mt-12 sm:mt-14" aria-hidden>
          <div className="overflow-hidden rounded-2xl border border-[var(--hz-paper-line)] bg-white px-4 py-6 sm:px-8 sm:py-10">
            <DottedMap
              width={150}
              height={75}
              mapSamples={4200}
              markers={OFFICES.map((o) => ({ lat: o.lat, lng: o.lng, size: o.hq ? 0.55 : 0.45 }))}
              dotColor="var(--hz-paper-line)"
              markerColor="var(--hz-cobalt)"
              dotRadius={0.18}
              pulse
              className="h-auto w-full text-[var(--hz-paper-line)]"
            />
          </div>
        </Reveal>

        <ul className="mt-10 grid gap-x-10 gap-y-8 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {OFFICES.map((o) => (
            <li key={o.city} className="border-t border-[var(--hz-paper-line)] pt-5">
              <p className="flex items-center gap-2 text-[15px] font-semibold text-[var(--hz-text)]">
                <span aria-hidden>{o.flag}</span>
                {o.city}
                {o.hq && (
                  <span className="rounded-full bg-[var(--hz-cobalt-100)] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--hz-cobalt)]">
                    HQ
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-[13px] text-[var(--hz-text-subtle)]">{o.country}</p>
              <address className="mt-3 not-italic text-[13.5px] leading-relaxed text-[var(--hz-text-mute)]">
                {o.address}
              </address>
              {o.phone && (
                <a
                  href={telHref(o.phone)}
                  className="mt-3 inline-block text-[13.5px] font-medium text-[var(--hz-cobalt)] transition-opacity hover:opacity-80"
                >
                  {o.phone}
                </a>
              )}
            </li>
          ))}
        </ul>

        <p className="mt-10 text-[14.5px] text-[var(--hz-text-mute)]">
          Or email{" "}
          <a
            href="mailto:hr@oceanbluecorp.com"
            className="font-medium text-[var(--hz-cobalt)] transition-opacity hover:opacity-80"
          >
            hr@oceanbluecorp.com
          </a>
          {" "}and it reaches all four.
        </p>
      </div>
    </section>
  );
}
