"use client";

import { ArrowRight } from "lucide-react";
import { Reveal } from "./motion/Primitives";
import { Cta } from "./ui";
import Photo from "./Photo";
import { IMG } from "./media";

export default function CallToAction({ content = {} }: { content?: Record<string, string> }) {
  return (
    <section className="relative isolate w-full overflow-hidden" style={{ background: "#07142b" }}>
      {/* Related photograph (local; falls back to brand gradient) */}
      <Photo src={IMG.cta} className="z-0" fallback="linear-gradient(135deg, #0e2147 0%, #07142b 100%)" />
      <div
        aria-hidden
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,12,28,0.88) 0%, rgba(7,20,43,0.82) 100%), radial-gradient(60% 80% at 50% 0%, rgba(29,78,216,0.45), transparent 60%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-28 text-center sm:px-8 sm:py-36">
        <Reveal className="flex flex-col items-center">
          <h2 className="hz-display max-w-[18ch] text-[2.5rem] text-white sm:text-[3.5rem]">
            {content.ctaHeading || "Tell us what you're building. We'll put the right team on it."}
          </h2>
          <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/70 sm:text-[18px]">
            {content.ctaBody ||
              "Staffing, enterprise solutions, or managed operations — start with a conversation, and we'll stand behind the result."}
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Cta href="/contact" variant="primary" icon={ArrowRight}>{content.ctaButton || "Book a discovery call"}</Cta>
            <Cta href="/services" variant="ghostDark">Explore services</Cta>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
