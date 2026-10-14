"use client";

import { useEffect, useState } from "react";

/**
 * Floating corner button, shown once the footer comes into view. It rides up
 * with the footer's bottom bar so it never covers the staff sign-in buttons.
 */
// Button height plus its corner offset, with a little room
const CLEARANCE = 140;

export default function BackToTop() {
  const [shown, setShown] = useState(false);
  const [lift, setLift] = useState(0);

  useEffect(() => {
    const update = () => {
      const footer = document.querySelector("footer");
      // Only once the corner it occupies is over the footer, never over the section above
      setShown(!!footer && footer.getBoundingClientRect().top < window.innerHeight - CLEARANCE);
      const bar = document.querySelector("[data-footer-bar]");
      const overlap = bar ? window.innerHeight - bar.getBoundingClientRect().top : 0;
      setLift(Math.max(0, overlap));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      title="Back to top"
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
      onClick={() =>
        window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
      }
      style={{ transform: `translateY(-${lift}px)` }}
      className={`fixed bottom-5 right-5 z-40 grid size-11 place-items-center bg-navy-800 text-tide-300 transition-[opacity,background-color,color] duration-300 hover:bg-cyan-500 hover:text-navy-950 motion-reduce:transition-none md:bottom-8 md:right-8 ${
        shown ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <svg aria-hidden viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 15.5v-11M5 9l5-5 5 5" />
      </svg>
    </button>
  );
}
