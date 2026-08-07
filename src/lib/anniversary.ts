/* ============================================================
   TEMPORARY — the 13-year celebration (August 8, 2026).

   Everything the anniversary needs lives here and in
   `src/components/landing/anniversary/`. To retire the whole
   thing: delete both, drop the `<Anniversary>` line and the
   `anniversary` prop in `src/app/page.tsx`, delete
   `src/app/13-years/`. Nothing else on the landing page depends
   on this module — permanent company facts are in `lib/company.ts`.
   ============================================================ */

import { BRAND_NAME, FOUNDED_YEAR, FOUNDED_LONG } from "./company";

export const ANNIVERSARY_YEAR = 2026;

/** 13. Derived, so it cannot drift from the founding year. */
export const ANNIVERSARY_YEARS = ANNIVERSARY_YEAR - FOUNDED_YEAR;

export const ANNIVERSARY_LONG = "August 8, 2026";
export const ANNIVERSARY_SPAN = `${FOUNDED_YEAR}—${ANNIVERSARY_YEAR}`;
export const ANNIVERSARY_PATH = "/13-years";

/** The celebration graphic (1024×1024), shown on /13-years. If the file ever
 *  goes missing the page renders the brand gradient in its place rather than a
 *  broken image — see <Photo>. */
export const ANNIVERSARY_ARTWORK = "/anniversary/13-years.jpg";

/** Headline copy, mirrored from the celebration artwork so the site and the
 *  social post say the same thing. Overridable per-field from /admin/content. */
export const ANNIVERSARY_COPY = {
  eyebrow: `${FOUNDED_LONG} — ${ANNIVERSARY_LONG}`,
  /* Split in two so the second half can carry the cobalt, exactly as the
     artwork sets it: the company name in ink, "Turns 13" in brand blue.
     Kept as a joined string too, for anywhere that needs the plain sentence
     (metadata, the OG card, the accessible name). */
  headingLead: BRAND_NAME,
  headingAccent: `Turns ${ANNIVERSARY_YEARS}`,
  heading: `${BRAND_NAME} Turns ${ANNIVERSARY_YEARS}`,
  tagline: `Celebrating ${ANNIVERSARY_YEARS} years of innovation, trust, and excellence.`,
  thanks:
    "Thank you to our employees, clients, and partners for being part of our journey.",
} as const;

/* The celebration is a single day, but the band should not vanish at midnight
   while people are still reading the LinkedIn post — and it must not still be
   up at Christmas because somebody forgot to switch it off. So: a window that
   opens a week before and closes two weeks after, with the CMS toggle able to
   override in either direction. */
const WINDOW_OPENS = Date.UTC(2026, 7, 1); //  Aug  1, 2026
const WINDOW_CLOSES = Date.UTC(2026, 7, 23); // Aug 23, 2026

/**
 * Whether the anniversary treatment renders.
 *
 * - `anniversary: "true"`  in the CMS → always on (outlives the window)
 * - `anniversary: "false"` in the CMS → always off (kills it immediately)
 * - unset → on for the celebration window only, then retires itself
 *
 * Call this on the **server** and pass the result down as a prop. Reading the
 * clock inside a client component would let the server and the browser disagree
 * across midnight and produce a hydration mismatch.
 */
export function isAnniversaryLive(
  content: Record<string, string> = {},
  now: Date = new Date(),
): boolean {
  const flag = (content.anniversary || "").trim().toLowerCase();
  if (flag === "true") return true;
  if (flag === "false") return false;
  const t = now.getTime();
  return t >= WINDOW_OPENS && t < WINDOW_CLOSES;
}
