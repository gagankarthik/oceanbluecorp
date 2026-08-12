"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/* ============================================================
   VideoBackdrop — a looping film behind a section.

   ── What this costs, and how it is paid ──────────────────────
   The hero film is 11MB. Left to itself the browser would start
   pulling it during hydration, alongside everything else the page
   needs to become interactive, for a background nobody is looking
   at in the first second. So the <source> is not attached until
   after `load`, and only then does the element get told to play.
   Until that moment the section shows the gradient ground below,
   which is a perfectly good hero on its own — the same bargain the
   shader backdrop made.

   That ordering matters here more than usual: with no photograph,
   the hero's LCP element is the HEADLINE, which is CSS-animated
   and present in the server HTML. Nothing about the film should be
   allowed to get in front of that.

   ── The autoplay rules ───────────────────────────────────────
   `muted` and `playsInline` are not optional. Every current mobile
   browser refuses to autoplay a video with sound, and iOS will
   take a non-inline video fullscreen. `play()` is called manually
   and its rejection swallowed: a browser is entitled to refuse,
   and the correct response is to keep showing the gradient, not to
   throw.

   Reduced motion gets no film at all — a looping background is
   exactly the kind of ambient movement that setting is for.
   ============================================================ */

export default function VideoBackdrop({
  src,
  className = "",
  /** 0-100, matching ShaderBackdrop, so a section can dial the film back
   *  behind its own scrim rather than fighting it with a heavier overlay. */
  intensity = 100,
}: {
  src: string;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);

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

  /* play() is what STARTS the download here, and it has to be called from an
     effect rather than waited for.

     `preload="none"` is deliberate — it is what keeps 11MB off the critical
     path until after `load`. But it also means the element fetches nothing on
     its own, so `canplay` never fires. Waiting for that event before calling
     play() deadlocks: no play, so no fetch; no fetch, so no canplay. Calling
     play() when armed breaks the cycle, and the event handlers below stay as a
     second chance for the case where the first call is refused. */
  useEffect(() => {
    if (armed) start();
  }, [armed]);

  return (
    <div aria-hidden className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* The ground. Present from first paint, and the permanent state for
          reduced-motion visitors and anyone whose browser declines to play. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(65% 80% at 18% 15%, rgba(29,78,216,0.30), transparent 62%), radial-gradient(55% 70% at 92% 88%, rgba(143,180,253,0.14), transparent 60%)",
        }}
      />

      {!reduce && (
        <video
          ref={ref}
          // `src` rather than a <source> child, set only once armed. React
          // updating the attribute makes the element re-resolve on its own; a
          // conditionally rendered <source> needs a manual load() call, which
          // is what created the race above.
          src={armed ? src : undefined}
          muted
          loop
          playsInline
          preload="none"
          onCanPlay={start}
          onLoadedData={start}
          onPlaying={() => setPlaying(true)}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out"
          // Faded up only once frames are actually arriving, so the swap from
          // gradient to film is a dissolve rather than a black rectangle
          // appearing while the first frame decodes.
          style={{ opacity: playing ? intensity / 100 : 0 }}
        />
      )}
    </div>
  );
}
