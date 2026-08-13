import type { Metadata } from "next";
import NotFoundContent from "./_not-found-content";

/**
 * 404.
 *
 * Was a hand-drawn SVG character on a violet palette (#3B0764 through #7C3AED)
 * with an indigo button, which made this the only page on the site not using
 * the cobalt accent. It is the brand's own palette now, and the numeral does
 * the work the illustration was doing.
 *
 * Centred, and the only centred page on the site: everywhere else the reader
 * is mid-journey and the type is left-aligned to be read. Here they have hit a
 * dead end and there is nothing to read, so the composition is one stopped
 * moment with the ways out beneath it.
 *
 * No search field: the marketing site has no site-wide search, and a box that
 * cannot search anything is worse than no box. The destinations in
 * _not-found-content are real routes and cover where a lost visitor wants to go.
 *
 * This file stays a server component so it can own `metadata`; the composition
 * and its motion live in the client component it renders.
 */

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      <NotFoundContent />
    </div>
  );
}
