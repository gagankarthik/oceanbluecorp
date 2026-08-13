"use client";

import { useState } from "react";
import Link from "next/link";
import { Reveal } from "./motion/Primitives";

/**
 * The company film, as a click-to-load facade.
 *
 * A bare YouTube <iframe> costs every visitor ~1MB of player JS and sets
 * third-party cookies before anyone presses play. Until the click, this is a
 * poster and a button; the iframe is created on click with autoplay, so the
 * first press is also the press that starts playback.
 *
 * Uses youtube-nocookie.com. The poster is a plain <img> because it is
 * already an optimised JPEG at a fixed size; maxresdefault does not exist for
 * every upload, so onError falls back to hqdefault, which always does.
 */

const VIDEO_ID = "aNqPIFgkja4";

export default function FilmSection() {
  const [playing, setPlaying] = useState(false);
  const [poster, setPoster] = useState(
    `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`,
  );

  return (
    <section className="w-full bg-[var(--hz-paper)] py-16 sm:py-20 lg:py-24">
      {/* Film left, copy right. Mirrored and re-proportioned against the
          closing careers band, which is otherwise the same composition with
          only the accreditation strip between them. `order` applies at lg
          only; on a phone the copy still comes first.

          Narrower than the page container and centred, so the pair sits as one
          centred block with equal air at both ends. The columns are adjacent,
          which leaves the grid gap as the only gutter between them rather than
          a whole empty column down the middle. */}
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-6 sm:px-10 lg:grid-cols-12 lg:gap-14 lg:px-8">
        <Reveal className="lg:order-2 lg:col-span-5">
          <h2 className="hz-display hz-h2 max-w-[16ch] text-[var(--hz-text)]">
            Meet the team behind the work.
          </h2>
          <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-[var(--hz-text-mute)] sm:mt-6 sm:text-[17px]">
            A short introduction to who we are and how an engagement actually runs,
            from the first shortlist to the quarterly review.
          </p>
          <Link
            href="/about"
            className="hz-focus mt-8 inline-flex items-center rounded-full border border-[var(--hz-text)]/25 px-6 py-3 text-[14.5px] font-semibold text-[var(--hz-text)] transition-all duration-200 hover:border-[var(--hz-text)] active:scale-[0.98] sm:mt-10"
          >
            More about us
          </Link>
        </Reveal>

        <Reveal delay={0.08} className="lg:order-1 lg:col-span-7">
          <div className="relative aspect-video w-full max-w-[520px] overflow-hidden rounded-xl bg-[var(--hz-plate-well)] ring-1 ring-[var(--hz-paper-line)] lg:max-w-none">
            {playing ? (
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
                title="Ocean Blue Solutions"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label="Play the Ocean Blue Solutions film"
                // Light ring: the button covers the poster frame, where a
                // cobalt one is not reliably visible.
                className="hz-focus-dark group absolute inset-0 h-full w-full cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={poster}
                  alt=""
                  loading="lazy"
                  onError={() =>
                    setPoster(`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`)
                  }
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-[rgba(4,10,24,0.25)] transition-colors duration-300 group-hover:bg-[rgba(4,10,24,0.4)]"
                />
                <span
                  aria-hidden
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90 drop-shadow-[0_4px_18px_rgba(0,0,0,0.65)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110"
                >
                  <svg viewBox="0 0 24 24" className="h-12 w-12 sm:h-14 sm:w-14" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
