"use client";

/* ============================================================
   A world map of the four offices, built from OpenStreetMap
   raster tiles and nothing else.

   ── Why not a map library ────────────────────────────────────
   maplibre-gl is ~800KB, needs WebGL, and drives a continuous
   requestAnimationFrame loop. All of that buys panning, zooming,
   rotation and vector styling. This section shows four fixed
   points and never moves, so every one of those capabilities is
   dead weight, and the failure mode was severe: when its chunk
   did not load, the section sat on a loading spinner forever.

   What is left is eight <img> tags and some arithmetic. No
   library, no canvas, no WebGL, no animation frames, nothing to
   initialise and nothing to fail. It renders on the server, it
   works with JavaScript disabled, and a tile that 404s leaves a
   gap rather than an empty section.

   ── The arithmetic ───────────────────────────────────────────
   Tiles are Web Mercator. At zoom z the world is 256 * 2^z
   pixels square, and a coordinate maps to it as:

       x = (lng + 180) / 360 * WORLD
       y = (1 - ln(tan φ + sec φ) / π) / 2 * WORLD

   The same projection places the tiles and the pins, so they
   cannot drift apart. Everything is emitted as a percentage of
   the crop, so the whole thing scales with its container and
   needs no resize handling.

   ── Attribution ──────────────────────────────────────────────
   OSM's tile policy requires visible credit, so the notice below
   is not optional decoration. Note also that their tile servers
   are volunteer-funded and ask that heavy or commercial use move
   to a paid provider; at this volume (eight tiles, one section,
   cached hard) this is within the spirit of it, but if traffic
   grows this should move to a commercial tile host.
   ============================================================ */

const ZOOM = 2;
const TILE = 256;
const WORLD = TILE * 2 ** ZOOM;

function project(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * WORLD;
  const rad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * WORLD;
  return { x, y };
}

/* The window onto the world, in world pixels. Chosen so the four offices sit
   inside it with margin: they span x 276..749 and y 341..462 at this zoom.
   The top is generous because every pin carries a card above it. */
const CROP = { x0: 200, y0: 268, x1: 830, y1: 520 };
const CROP_W = CROP.x1 - CROP.x0;
const CROP_H = CROP.y1 - CROP.y0;

const TX0 = Math.floor(CROP.x0 / TILE);
const TX1 = Math.floor((CROP.x1 - 1) / TILE);
const TY0 = Math.floor(CROP.y0 / TILE);
const TY1 = Math.floor((CROP.y1 - 1) / TILE);

const TILES: { z: number; x: number; y: number }[] = [];
for (let ty = TY0; ty <= TY1; ty++) {
  for (let tx = TX0; tx <= TX1; tx++) TILES.push({ z: ZOOM, x: tx, y: ty });
}

const SHEET = {
  width: ((TX1 - TX0 + 1) * TILE * 100) / CROP_W,
  height: ((TY1 - TY0 + 1) * TILE * 100) / CROP_H,
  left: ((TX0 * TILE - CROP.x0) * 100) / CROP_W,
  top: ((TY0 * TILE - CROP.y0) * 100) / CROP_H,
};

export type MapPoint = {
  lat: number;
  lng: number;
  city: string;
  country: string;
  address: string;
  phone?: string;
  hq?: boolean;
  /** Stalk length in px. Staggered where two offices sit close together. */
  stalk?: number;
  /** Which end of the card the stalk meets, so cards lean away from a neighbour. */
  align?: "left" | "center" | "right";
};

export function positionOf(lat: number, lng: number) {
  const p = project(lat, lng);
  return {
    left: ((p.x - CROP.x0) / CROP_W) * 100,
    top: ((p.y - CROP.y0) / CROP_H) * 100,
  };
}

export default function OfficeMap({
  points,
  activeIndex,
  onSelect,
}: {
  points: MapPoint[];
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: `${CROP_W} / ${CROP_H}` }}
    >
      {/* The tile sheet, greyed and lightened so it reads as a ground for the
          pins rather than a map you are meant to study. OSM's default style is
          full colour and its road network would compete with the cards. */}
      <div
        aria-hidden
        className="absolute grid"
        style={{
          width: `${SHEET.width}%`,
          height: `${SHEET.height}%`,
          left: `${SHEET.left}%`,
          top: `${SHEET.top}%`,
          gridTemplateColumns: `repeat(${TX1 - TX0 + 1}, 1fr)`,
          filter: "grayscale(1) brightness(1.08) contrast(0.9) opacity(0.5)",
        }}
      >
        {TILES.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${t.z}/${t.x}/${t.y}`}
            src={`https://tile.openstreetmap.org/${t.z}/${t.x}/${t.y}.png`}
            alt=""
            width={TILE}
            height={TILE}
            loading="lazy"
            className="block h-full w-full select-none"
            draggable={false}
          />
        ))}
      </div>

      {/* Below `sm` the map is about 350px wide and a 190px card cannot sit
          beside its neighbour without leaving the frame, so on a phone the
          cards come off and the map is dots only. Nothing is lost: the full
          address list sits directly underneath, and on that width it is the
          thing a reader will actually use. */}
      {points.map((p, i) => {
        const pos = positionOf(p.lat, p.lng);
        const active = i === activeIndex;
        const stalk = p.stalk ?? 54;
        const align = p.align ?? "center";
        /* The card hangs off the top of the stalk. `align` decides which way it
           leans: Hyderabad and Vizianagaram are about two percent apart on this
           crop, so left-aligned cards would sit on top of each other. */
        const lean =
          align === "center"
            ? "left-1/2 -translate-x-1/2"
            : align === "left"
              ? "left-0"
              : "right-0";

        return (
          <div
            key={p.city}
            className="absolute"
            style={{ left: `${pos.left}%`, top: `${pos.top}%`, zIndex: active ? 30 : 20 }}
          >
            {/* The stalk. Drawn upward from the dot, which is the anchor: the
                dot marks the coordinate, the card must never sit on it. */}
            <span
              aria-hidden
              className={`absolute bottom-0 left-1/2 hidden w-px -translate-x-1/2 transition-colors duration-200 sm:block ${
                active ? "bg-[var(--hz-cobalt)]" : "bg-[var(--hz-cobalt)]/40"
              }`}
              style={{ height: stalk }}
            />

            {/* The card, at the top of the stalk. */}
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-pressed={active}
              className={`absolute ${lean} hidden w-[210px] cursor-pointer rounded-lg border bg-white px-3 py-2 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hz-cobalt)] sm:block ${
                active
                  ? "border-[var(--hz-cobalt)] shadow-[0_10px_28px_-10px_rgba(15,23,42,0.4)]"
                  : "border-[var(--hz-paper-line)] shadow-[0_6px_18px_-10px_rgba(15,23,42,0.35)] hover:border-[var(--hz-cobalt)]/50"
              }`}
              style={{ bottom: stalk }}
            >
              {/* No flag emoji. Windows has no colour flag glyphs, so every
                  one of these rendered as the bare country code, "US", "IN",
                  "GB", which reads as a typo rather than a flag. */}
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--hz-text)]">
                {p.city}
                {p.hq && (
                  <span className="rounded-full bg-[var(--hz-cobalt-100)] px-1.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[var(--hz-cobalt)]">
                    HQ
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-[11px] text-[var(--hz-text-subtle)]">
                {p.country}
              </span>
              <span className="mt-1.5 block text-[11px] leading-snug text-[var(--hz-text-mute)]">
                {p.address}
              </span>
              {p.phone && (
                <span className="mt-1.5 block text-[11px] font-medium text-[var(--hz-cobalt)]">
                  {p.phone}
                </span>
              )}
            </button>

            {/* The dot, exactly on the coordinate. */}
            <span
              aria-hidden
              className={`absolute left-1/2 top-0 block -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white transition-all duration-200 ${
                active
                  ? "h-3.5 w-3.5 bg-[var(--hz-cobalt)] shadow-[0_0_0_5px_color-mix(in_srgb,var(--hz-cobalt)_26%,transparent)]"
                  : "h-2.5 w-2.5 bg-[var(--hz-cobalt)]/70"
              }`}
            />
          </div>
        );
      })}

      {/* Required by the OSM tile usage policy. */}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-1.5 right-2 z-40 rounded bg-white/75 px-1.5 py-0.5 text-[10.5px] text-[var(--hz-text-subtle)] transition-colors hover:text-[var(--hz-text-mute)]"
      >
        © OpenStreetMap contributors
      </a>
    </div>
  );
}
