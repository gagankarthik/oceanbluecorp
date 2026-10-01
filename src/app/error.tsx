"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CONTAINER } from "@/components/site/sections";
import { LinkButton, buttonClass } from "@/components/site/button";
import { IconArrowRight, IconRefresh } from "@/components/site/icons";
import { LineGrid } from "@/components/site/line-grid";
import { LoadErrorArt } from "@/components/site/load-error-art";

/**
 * Route-level error boundary for the public site. Without this, an unhandled
 * render error drops visitors on Next's stock screen with no way back.
 *
 * Same layout as the 404 and the maintenance screen: the picture says what
 * happened, the words are a heading, one line and the way out. The digest is
 * shown so anyone reporting the problem has something specific to quote.
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
    <section className="relative isolate overflow-hidden bg-white">
      <LineGrid />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_30%,var(--color-cobalt-tint),transparent)]" />

      <div className={`${CONTAINER} grid min-h-[70svh] items-center gap-8 pt-28 pb-16 sm:pt-32 sm:pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12 lg:pb-24`}>
        <LoadErrorArt className="rise mx-auto h-auto w-full max-w-[420px] lg:order-2 lg:max-w-none" />

        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="rise inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 type-caption font-semibold text-danger" style={{ animationDelay: "200ms" }}>
            <span className="size-1.5 rounded-full bg-danger" aria-hidden />
            Something went wrong
          </p>
          <h1 className="rise mt-4 type-headline-lg font-semibold text-ink" style={{ animationDelay: "280ms" }}>
            This page didn&rsquo;t load.
          </h1>
          <p className="rise mt-4 max-w-[44ch] type-body-lg text-ink-muted" style={{ animationDelay: "360ms" }}>
            The problem is on our end, not yours. Trying again usually clears it.
          </p>

          <div className="rise mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start" style={{ animationDelay: "440ms" }}>
            <button type="button" onClick={reset} className={buttonClass("primary", "lg")}>
              <IconRefresh size={16} />
              Try again
            </button>
            <LinkButton href="/" variant="outline" size="lg" className="group">
              Back to home
              <IconArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </LinkButton>
          </div>

          <p className="rise mt-6 type-body-sm text-ink-muted" style={{ animationDelay: "520ms" }}>
            Still stuck?{" "}
            <Link href="/contact" className="font-semibold text-ink underline underline-offset-4 hover:text-cobalt">
              Report this
            </Link>
            {error.digest && (
              <>
                {" "}and quote <span className="font-mono text-[13px] break-all text-ink">{error.digest}</span>
              </>
            )}
            .
          </p>
        </div>
      </div>
    </section>
  );
}
