/* ============================================================
   WordsRise — the headline entrance for above-the-fold copy.

   Deliberately NOT a framer-motion component and deliberately not
   "use client": it renders plain markup whose animation lives in
   the stylesheet (.hz-word in globals.css). That distinction is the
   whole point. The motion version set opacity:0 as the server-
   rendered state and only revealed the text once React hydrated,
   which left the hero headline — the LCP element and the page's
   single most important sentence — blank for five to eight seconds
   on a cold load. A CSS animation starts at first paint and owes
   nothing to the bundle.

   For copy BELOW the fold, use WordsReveal/Reveal instead: there,
   waiting for hydration costs nothing and scroll-triggering is
   worth the JavaScript.
   ============================================================ */

import { Fragment } from "react";

export default function WordsRise({
  text,
  className,
  delay = 0,
  step = 0.06,
}: {
  text: string;
  className?: string;
  /** Seconds before the first word starts. */
  delay?: number;
  /** Seconds between consecutive words. */
  step?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        // The separating space is a sibling of the clip span, never a child of
        // it. Inside, `overflow: hidden` swallows the trailing space and the
        // headline renders as "Thepeopleandplatforms"; outside, it is an
        // ordinary text node that still allows the line to wrap.
        <Fragment key={`${w}-${i}`}>
          <span className="hz-word-clip">
            <span className="hz-word" style={{ animationDelay: `${delay + i * step}s` }}>
              {w}
            </span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </span>
  );
}
