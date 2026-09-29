"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CONTAINER } from "@/components/site/sections";
import { LinkButton } from "@/components/site/button";
import { IconArrowRight, type IconProps } from "@/components/site/icons";

/**
 * Route-level error boundary for the public site. Without this, an unhandled
 * render error drops visitors on Next's stock screen with no way back.
 *
 * Same treatment as the 404: white ground, cobalt accent, plain language, real
 * routes out. The digest is surfaced so anyone reporting the problem has
 * something specific to quote.
 */

const IconRefresh = ({ size = 16, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    <path d="M19.5 11A7.5 7.5 0 0 0 6.2 6.8M4.5 13a7.5 7.5 0 0 0 13.3 4.2M5.5 3.5V7H9M18.5 20.5V17H15" />
  </svg>
);

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface in the console and any attached RUM or log drain.
    console.error("[oceanblue] unhandled route error:", error);
  }, [error]);

  return (
    <section className="bg-white">
      <div className={`${CONTAINER} grid min-h-[70svh] gap-10 pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:gap-16`}>
        <div>
          <p className="rise type-label font-semibold text-cobalt">Something went wrong</p>
          <h1 className="rise mt-3 max-w-[16ch] type-headline-lg font-semibold text-ink" style={{ animationDelay: "80ms" }}>
            This page did not load.
          </h1>
          <p className="rise mt-6 max-w-[46ch] type-body-lg text-ink-muted" style={{ animationDelay: "160ms" }}>
            The problem is on our end, not yours. Trying again usually clears it.
            If it keeps happening, tell us and we will look into it.
          </p>
          <div className="rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "240ms" }}>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-cobalt px-6 text-[15.5px] font-semibold text-white transition-colors hover:bg-cobalt-deep active:translate-y-px"
            >
              <IconRefresh size={16} />
              Try again
            </button>
            <LinkButton href="/" variant="outline" size="lg" className="group">
              Back to home
              <IconArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </LinkButton>
          </div>
        </div>

        <div className="rise rounded-2xl border border-line bg-paper p-7 sm:p-8" style={{ animationDelay: "320ms" }}>
          <p className="text-[16px] font-semibold text-ink">Still stuck?</p>
          <p className="mt-2 type-body text-ink-muted">
            <Link href="/contact" className="font-semibold text-cobalt underline underline-offset-4">
              Report this
            </Link>{" "}
            {error.digest ? "and include the reference below, so we can find it in our logs." : "and tell us which page you were on."}
          </p>
          {error.digest && (
            <p className="mt-6 border-t border-line pt-5 font-mono text-[13px] break-all text-ink-subtle">Reference: {error.digest}</p>
          )}
        </div>
      </div>
    </section>
  );
}
