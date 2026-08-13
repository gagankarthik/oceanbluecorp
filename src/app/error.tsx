"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, ArrowRight } from "lucide-react";

/**
 * Route-level error boundary for the public site. Without this, an unhandled
 * render error drops visitors on Next's stock screen with no way back.
 *
 * Same treatment as the 404: brand ground, cobalt accent, plain language, real
 * routes out. The digest is surfaced so anyone reporting the problem has
 * something specific to quote.
 */

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
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      <section className="mx-auto flex w-full max-w-[2200px] flex-col px-6 py-20 sm:px-10 sm:py-24 lg:px-16 lg:py-28 2xl:px-24">
        <div className="max-w-2xl">
          <p className="hz-eyebrow text-[var(--hz-cobalt)]">Something went wrong</p>
          <h1 className="hz-display hz-h2 mt-5 max-w-[16ch] text-[var(--hz-text)]">
            This page did not load.
          </h1>
          <p className="mt-6 max-w-[46ch] text-[16px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[17px]">
            The problem is on our end, not yours. Trying again usually clears it.
            If it keeps happening, tell us and we will look into it.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              type="button"
              onClick={reset}
              className="hz-focus inline-flex items-center gap-2 rounded-full bg-[var(--hz-cobalt)] px-6 py-3 text-[14px] font-semibold text-white transition-all duration-200 hover:bg-[var(--hz-cobalt-600)] active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
              Try again
            </button>
            <Link
              href="/"
              className="hz-focus group inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--hz-text-mute)] transition-colors hover:text-[var(--hz-cobalt)]"
            >
              Back to home
              <ArrowRight
                className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1"
                strokeWidth={1.75}
              />
            </Link>
            <Link
              href="/contact"
              className="hz-focus text-[14px] font-semibold text-[var(--hz-text-mute)] underline-offset-4 transition-colors hover:text-[var(--hz-cobalt)] hover:underline"
            >
              Report this
            </Link>
          </div>

          {error.digest && (
            <p className="mt-12 border-t border-[var(--hz-line)] pt-5 font-mono text-[12px] text-[var(--hz-text-subtle)]">
              Reference: {error.digest}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
