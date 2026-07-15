"use client";

import { useCallback, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./motion/Primitives";
import { Cta } from "./ui";

// Big phrases that scroll behind the CTA; the spotlight lights them under the cursor.
const rows = [
  { text: "LET'S BUILD SOMETHING DURABLE", reverse: false },
  { text: "STAFFING · SOLUTIONS · MANAGED SERVICES", reverse: true },
  { text: "ONE ACCOUNTABLE PARTNER", reverse: false },
  { text: "START A CONVERSATION", reverse: true },
];

function MarqueeRow({ text, reverse, cls }: { text: string; reverse: boolean; cls: string }) {
  const seq = `${text} ✦ `;
  return (
    <div
      className="hz-marquee flex w-max"
      style={reverse ? { animationDirection: "reverse" } : undefined}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className={`hz-display whitespace-nowrap px-4 text-[13vw] font-semibold leading-[1.05] sm:text-[9vw] ${cls}`}
        >
          {seq}
        </span>
      ))}
    </div>
  );
}

export default function CallToAction({ content = {} }: { content?: Record<string, string> }) {
  const ref = useRef<HTMLElement>(null);
  const raf = useRef(0);

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const x = e.clientX;
    const y = e.clientY;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${x - r.left}px`);
      el.style.setProperty("--my", `${y - r.top}px`);
    });
  }, []);

  const spotMask =
    "radial-gradient(280px circle at var(--mx, 50%) var(--my, 50%), #000 0%, #000 18%, transparent 60%)";

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      className="relative isolate w-full overflow-hidden py-28 sm:py-36"
      style={{ background: "#07142b" }}
    >
      {/* Base marquee — dim */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 flex flex-col justify-center gap-[1.5vh] select-none">
        {rows.map((r) => (
          <MarqueeRow key={r.text} text={r.text} reverse={r.reverse} cls="text-white/[0.05]" />
        ))}
      </div>

      {/* Spotlight marquee — bright, revealed only under the cursor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] flex flex-col justify-center gap-[1.5vh] select-none"
        style={{ maskImage: spotMask, WebkitMaskImage: spotMask }}
      >
        {rows.map((r) => (
          <MarqueeRow key={r.text} text={r.text} reverse={r.reverse} cls="text-[var(--hz-cyan-400)]" />
        ))}
      </div>

      {/* Cursor glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            "radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgba(29,78,216,0.22), transparent 70%)",
        }}
      />

      {/* Readability scrim behind the content */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{ background: "radial-gradient(58% 62% at 50% 50%, rgba(5,12,28,0.82) 0%, rgba(5,12,28,0.5) 55%, transparent 100%)" }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center sm:px-8">
        <Reveal className="flex flex-col items-center">
          <h2 className="hz-display max-w-[18ch] text-[2.3rem] leading-[1.05] text-white sm:text-[3.5rem] 2xl:text-[4rem]">
            {content.ctaHeading || "Tell us what you're building. We'll put the right team on it."}
          </h2>
          <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/70 sm:text-[18px]">
            {content.ctaBody ||
              "Staffing, enterprise solutions, or managed services — start with a conversation, and we'll stand behind the result."}
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Cta href="/contact" variant="primary" icon={ArrowRight}>{content.ctaButton || "Book a discovery call"}</Cta>
            <Cta href="/solutions" variant="ghostDark">Explore solutions</Cta>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
