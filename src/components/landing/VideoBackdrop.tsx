"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useReducedMotion } from "@/components/site/use-reduced-motion";

/**
 * A film behind a section, deferred until after `load`. It plays through
 * once and holds on its last frame, so nothing loops for good.
 *
 * The film is not attached until the page has loaded; until then the section
 * shows `poster`, the film's own first frame, over the gradient ground.
 *
 * Keep the encode small. A 13.8MB source made Next's dev server answer the
 * media element's range requests with a repeating 503 and the film never
 * decoded at all; re-encoded to 468KB it plays immediately. A muted, looping
 * background has no business shipping megabytes.
 * The hero's LCP element is the headline, and nothing about the film should
 * get in front of it.
 *
 * `muted` and `playsInline` are required: mobile browsers refuse to autoplay
 * audio, and iOS takes non-inline video fullscreen. A rejected `play()` is
 * swallowed, leaving the gradient in place. Reduced motion gets no film.
 */

export default function VideoBackdrop({
  src,
  poster,
  className = "",
  /** 0-100, so a section can dial the film back behind its own scrim rather
   *  than fighting it with a heavier overlay. */
  intensity = 100,
}: {
  src: string;
  /** First frame of `src`, shown until the film has decoded and under reduced
   *  motion. Without it the section falls back to a bare gradient, which is a
   *  visibly different picture rather than a still of the same one. */
  poster?: string;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);
  // WCAG 2.2.2: a looping film needs a way to stop it.
  const [paused, setPaused] = useState(false);
  // Plays through once and holds its last frame: no perpetual ambient loop.
  const [ended, setEnded] = useState(false);
  const togglePause = () => {
    const v = ref.current;
    if (!v) return;
    if (paused) { void v.play().catch(() => {}); setPaused(false); }
    else { v.pause(); setPaused(true); }
  };

  useEffect(() => {
    if (reduce) return;
    const arm = () => setArmed(true);
    if (document.readyState === "complete") arm();
    else window.addEventListener("load", arm, { once: true });
    return () => window.removeEventListener("load", arm);
  }, [reduce]);

  const start = () => {
    void ref.current?.play().catch(() => {
      /* Autoplay refused. The gradient below stays; nothing to do. */
    });
  };

  // play() is what starts the download. With `preload="none"` the element
  // fetches nothing on its own, so waiting for `canplay` first would deadlock:
  // no play, no fetch; no fetch, no canplay. The handlers below are a retry
  // for the case where this first call is refused.
  useEffect(() => {
    if (armed) start();
  }, [armed]);

  return (
    <>
    <div aria-hidden className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Present from first paint, and the permanent state under reduced
          motion or when the browser declines to play. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(65% 80% at 18% 15%, rgba(29,78,216,0.30), transparent 62%), radial-gradient(55% 70% at 92% 88%, rgba(143,180,253,0.14), transparent 60%)",
        }}
      />

      {/* An <img>, not a CSS background: it is often the page's largest
          paint, and the browser finds an <img> in the HTML immediately. */}
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: playing ? 0 : intensity / 100 }}
        />
      )}

      {!reduce && (
        <video
          ref={ref}
          // `src` rather than a <source> child: React updating the attribute
          // makes the element re-resolve on its own, whereas a conditionally
          // rendered <source> needs a manual load() call.
          src={armed ? src : undefined}
          muted
          playsInline
          preload="none"
          onCanPlay={start}
          onLoadedData={start}
          onPlaying={() => setPlaying(true)}
          onEnded={() => setEnded(true)}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out"
          // Faded up only once frames are arriving, so the swap is a dissolve
          // rather than a black rectangle while the first frame decodes.
          style={{ opacity: playing ? intensity / 100 : 0 }}
        />
      )}
    </div>
    {/* Outside the aria-hidden backdrop so it stays operable. */}
    {!reduce && playing && !ended && (
      <button
        type="button"
        onClick={togglePause}
        aria-label={paused ? "Play background video" : "Pause background video"}
        className="absolute bottom-4 right-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/60 bg-black/40 text-white transition-colors hover:bg-black/60"
      >
        {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
      </button>
    )}
    </>
  );
}
