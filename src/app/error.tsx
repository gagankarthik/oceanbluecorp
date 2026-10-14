"use client";

import { useEffect } from "react";
import Link from "next/link";
import StatusCard, { BrokenIcon, primaryAction, secondaryAction } from "@/components/site/StatusCard";

/**
 * Route-level error boundary for the public site. The digest is shown so
 * anyone reporting the problem has something specific to quote.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[oceanblue] unhandled route error:", error);
  }, [error]);

  return (
    <StatusCard
      icon={<BrokenIcon />}
      eyebrow="Something went wrong"
      title="This page didn't load"
      body="The problem is on our side, not yours. Trying again usually clears it."
      actions={
        <>
          <button type="button" onClick={reset} className={primaryAction}>
            Try again
          </button>
          <Link href="/" className={secondaryAction}>
            Go to homepage
          </Link>
        </>
      }
      footnote={
        <p>
          Still stuck?{" "}
          <Link href="/contact" className="font-medium text-ocean-700 underline underline-offset-4">
            Tell us
          </Link>
          {error.digest && (
            <>
              {" "}
              and quote <span className="break-all font-mono text-small text-navy-900">{error.digest}</span>
            </>
          )}
          .
        </p>
      }
    />
  );
}
