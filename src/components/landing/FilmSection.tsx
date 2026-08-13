"use client";

import { useState } from "react";
import Link from "next/link";
import { Reveal } from "./motion/Primitives";

/* ============================================================
   The company film.

   ── Why this is not the iframe as given ──────────────────────
   Dropping YouTube's <iframe> straight into the page makes every
   visitor pay for it whether or not they ever press play: roughly
   a megabyte of player JavaScript, several extra connections, and
   third-party cookies set before anyone has consented to
   anything. On a page where the hero video is deliberately
   deferred until after `load` and a hero photo preload was
   removed for spending bandwidth on nothing, shipping that at the
   top of the section would undo the lot.

   So this is a facade. Until someone clicks, the section is one
   JPEG and a button. The iframe is created on that click, with
   autoplay, so the first press is also the press that starts it,
   not a click that loads a player you then have to click again.

   ── The other two choices ────────────────────────────────────
   · youtube-nocookie.com, which does not set tracking cookies
     until playback starts. It costs nothing and it is the right
     default for a site with a cookie policy page.
   · The poster comes from i.ytimg.com as a plain <img> rather
     than next/image. It is already an optimised JPEG at a fixed
     size, so routing it through the image optimiser would add a
     proxy hop and a remotePatterns entry to gain nothing.
     maxresdefault is not guaranteed to exist for every upload, so
     onError falls back to hqdefault, which always does.
   ============================================================ */

const VIDEO_ID = "aNqPIFgkja4";

export default function FilmSection() {
  const [playing, setPlaying] = useState(false);
  const [poster, setPoster] = useState(
    `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`,
  );

  return (
    <section className="w-full bg-[var(--hz-ink)] py-16 sm:py-20 lg:py-24">
      {/* Split band: the argument on the left, the film on the right, on ink.
          The reference does this because it stops the video being the section
          and makes it the evidence for a sentence. It also solves the size
          problem on its own, at half the measure the frame is a companion to
          the copy rather than the point of the page. */}
      <div className="mx-auto grid w-full max-w-[2200px] items-center gap-10 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-16 2xl:px-28">
        <Reveal>
          <span className="hz-eyebrow block text-[var(--hz-aqua)]">Inside Ocean Blue</span>
          <h2 className="hz-display hz-h2 mt-4 max-w-[16ch] text-white">
            Meet the team behind the work.
          </h2>
          <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-white/70 sm:mt-6 sm:text-[17px]">
            A short introduction to who we are and how an engagement actually runs,
            from the first shortlist to the quarterly review.
          </p>
          <Link
            href="/about"
            className="mt-8 inline-flex items-center rounded-full border border-white/25 px-6 py-3 text-[14.5px] font-semibold text-white transition-colors hover:border-white sm:mt-10"
          >
            More about us
          </Link>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
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
                className="group absolute inset-0 h-full w-full cursor-pointer"
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
                {/* The reference uses a plain white triangle rather than a
                    filled disc, which keeps the frame reading as footage
                    instead of a card with a button on it. */}
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
