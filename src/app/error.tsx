"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, ArrowRight } from "lucide-react";

/* ============================================================
   Route-level error boundary for the public site. Without this,
   an unhandled render error dropped visitors on Next's stock
   error screen — unstyled, off-brand, and with no way back.

   Matches the 404 treatment: navy band, cobalt accent, plain
   language, and a route out. The digest is surfaced so someone
   reporting the problem can quote something useful.
   ============================================================ */

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface in the browser console and any attached RUM/log drain.
    console.error("[oceanblue] unhandled route error:", error);
  }, [error]);

  return (
    <div
      className="horizon relative isolate flex min-h-[78svh] w-full items-center overflow-hidden bg-[var(--hz-ink)]">
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(55% 70% at 12% 10%, rgba(29,78,216,0.4), transparent 60%), radial-gradient(45% 60% at 95% 90%, rgba(42,216,239,0.14), transparent 62%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 py-24 sm:px-8 sm:py-28">
        <p className="hz-eyebrow text-white/55">Something went wrong</p>
        <h1 className="hz-display mt-5 text-[clamp(1.9rem,4.6vw,3.25rem)] text-white">
          This page didn&rsquo;t load.
        </h1>
        <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/70">
          The problem is on our end, not yours. Try again — if it keeps happening,
          get in touch and we&rsquo;ll look into it.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            type="button"
            onClick={reset}
            className="hz-btn-fill inline-flex items-center gap-2 rounded-full bg-[var(--hz-cobalt)] px-6 py-3 text-[14px] font-semibold text-white bg-[var(--hz-ink)]">
            <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
            Try again
          </button>
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[14px] font-semibold text-white/70 transition-colors hover:text-white bg-[var(--hz-ink)]">
            Back to home
            <ArrowRight
              className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1"
              strokeWidth={1.75}
            />
          </Link>
          <Link
            href="/contact"
            className="text-[14px] font-semibold text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline bg-[var(--hz-ink)]">
            Report this
          </Link>
        </div>

        {error.digest && (
          <p className="mt-10 border-t border-white/15 pt-5 font-mono text-[12px] text-white/40">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
