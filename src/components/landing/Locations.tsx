"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Reveal } from "./motion/Primitives";

/* ============================================================
   Where we are.

   ── The map is real now, and that has a price ────────────────
   maplibre-gl plus a tile basemap is several hundred kilobytes
   and a run of network requests to a CDN. This section sits well
   below the fold on /contact, so none of it is fetched until it
   is nearly in view:

     · next/dynamic with ssr:false keeps the whole library out of
       the server render and the first payload.
     · An IntersectionObserver holds the import until the section
       is 400px away, so a visitor who never scrolls that far
       never pays for it at all.
     · Until then the frame shows the same panel with a quiet
       placeholder, so nothing jumps when it arrives.

   ── The card is the content, the map is the picture ──────────
   Clicking a pin swaps the card. The card is real text in the
   DOM at all times, and the full address list still sits below
   the map, so everything the map conveys is readable without it:
   a canvas of tiles is unusable to a screen reader, and this way
   nothing depends on it.
   ============================================================ */

const Map = dynamic(() => import("@/components/ui/map").then((m) => m.Map), {
  ssr: false,
});
const MapMarker = dynamic(
  () => import("@/components/ui/map").then((m) => m.MapMarker),
  { ssr: false },
);
const MarkerContent = dynamic(
  () => import("@/components/ui/map").then((m) => m.MarkerContent),
  { ssr: false },
);

type Office = {
  city: string;
  country: string;
  flag: string;
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
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const office = OFFICES[active];

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    // Measure first, then observe. If the section is ALREADY within range on
    // mount, which is the case for anyone arriving on /contact#locations or on
    // a tall screen, waiting for an IntersectionObserver callback is waiting
    // for something that may never be scheduled: observer callbacks are
    // delivered with the rendering steps, and a browser is free to defer those
    // (a background tab does exactly that). A synchronous rect check costs one
    // layout read and removes the dependency on that timing entirely.
    const NEAR = 400;
    const inRange = () => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight + NEAR && r.bottom > -NEAR;
    };
    if (inRange()) {
      setReady(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true);
          io.disconnect();
        }
      },
      { rootMargin: `${NEAR}px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

        <div
          ref={frameRef}
          className="relative mt-12 h-[420px] w-full overflow-hidden rounded-2xl border border-[var(--hz-paper-line)] bg-white sm:mt-14 sm:h-[520px]"
        >
          {ready ? (
            <Map
              theme="light"
              center={[10, 32]}
              zoom={1.35}
              attributionControl={false}
              className="absolute inset-0 h-full w-full"
            >
              {OFFICES.map((o, i) => (
                <MapMarker
                  key={o.city}
                  longitude={o.lng}
                  latitude={o.lat}
                  onClick={() => setActive(i)}
                >
                  <MarkerContent>
                    {/* The pin is a dot, not an icon. At world zoom four office
                        pins are four points; anything more detailed is noise at
                        this scale. The active one gets a ring so the card and
                        the map always agree on which office is being shown. */}
                    <span
                      className={`block cursor-pointer rounded-full transition-all duration-200 ${
                        i === active
                          ? "h-4 w-4 bg-[var(--hz-cobalt)] ring-4 ring-[var(--hz-cobalt)]/25"
                          : "h-3 w-3 bg-[var(--hz-cobalt)]/70 hover:bg-[var(--hz-cobalt)]"
                      }`}
                      aria-hidden
                    />
                  </MarkerContent>
                </MapMarker>
              ))}
            </Map>
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-[var(--hz-paper)]">
              <span className="text-[13px] text-[var(--hz-text-subtle)]">Loading map</span>
            </div>
          )}

          {/* The info card, over the map. Text, not a tooltip drawn on canvas,
              so it is selectable, readable and present before the map is. */}
          <div className="pointer-events-none absolute inset-x-4 bottom-4 sm:inset-x-auto sm:left-6 sm:top-6 sm:w-[340px]">
            <div className="pointer-events-auto rounded-xl border border-[var(--hz-paper-line)] bg-white/95 p-5 shadow-[0_18px_50px_-20px_rgba(15,23,42,0.35)] backdrop-blur-sm">
              <p className="flex items-center gap-2 text-[15px] font-semibold text-[var(--hz-text)]">
                <span aria-hidden>{office.flag}</span>
                {office.city}
                {office.hq && (
                  <span className="rounded-full bg-[var(--hz-cobalt-100)] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--hz-cobalt)]">
                    HQ
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-[12.5px] text-[var(--hz-text-subtle)]">{office.country}</p>
              <address className="mt-3 not-italic text-[13px] leading-relaxed text-[var(--hz-text-mute)]">
                {office.address}
              </address>
              {office.phone && (
                <a
                  href={telHref(office.phone)}
                  className="mt-3 inline-block text-[13px] font-medium text-[var(--hz-cobalt)] transition-opacity hover:opacity-80"
                >
                  {office.phone}
                </a>
              )}

              {/* Real buttons, so the map is reachable without a pointer:
                  tabbing through these moves the card and the active pin. */}
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[var(--hz-paper-line)] pt-3">
                {OFFICES.map((o, i) => (
                  <button
                    key={o.city}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-pressed={i === active}
                    className={`rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors ${
                      i === active
                        ? "bg-[var(--hz-cobalt)] text-white"
                        : "text-[var(--hz-text-mute)] hover:bg-[var(--hz-paper)]"
                    }`}
                  >
                    {o.city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <ul className="mt-10 grid gap-x-10 gap-y-8 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {OFFICES.map((o) => (
            <li key={o.city} className="border-t border-[var(--hz-paper-line)] pt-5">
              <p className="flex items-center gap-2 text-[15px] font-semibold text-[var(--hz-text)]">
                <span aria-hidden>{o.flag}</span>
                {o.city}
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
