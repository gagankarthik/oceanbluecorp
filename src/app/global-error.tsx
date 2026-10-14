"use client";

import { useEffect } from "react";

/**
 * Root error boundary. This replaces the entire document, including the root
 * layout, so it cannot rely on the layout's fonts, providers or globals.css.
 * Everything here is inline and self-contained on purpose, and the palette is
 * hardcoded to the brand values rather than read from tokens that will not
 * have loaded.
 *
 * Only fires when the root layout itself throws; ordinary route errors are
 * handled by error.tsx.
 */

// Brand values from styles/colors.css, inlined: the stylesheet may not have loaded.
const CANVAS = "#f5f8fa"; // mist-50
const TEXT = "#0b2e46"; // navy-900
const MUTE = "#4b6273"; // mist-600
const LINE = "#dbe5ea"; // mist-200
const ACTION = "#0a72c0"; // ocean-600
const ACTION_HOVER = "#085c9c"; // ocean-700
const LINK = "#085c9c";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[oceanblue] root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Something went wrong | Oceanblue Solutions, Inc.</title>
        <meta name="robots" content="noindex" />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: CANVAS,
          color: TEXT,
          fontFamily:
            "'General Sans', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <main style={{ maxWidth: 760, padding: "32px 24px 80px" }}>
          {/* Plain <a>: a full navigation, since the client router may be what broke. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 40, marginBottom: 32, fontSize: 15, fontWeight: 500, color: LINK, textDecoration: "none" }}
          >
            <span aria-hidden>&larr;</span> Back to home
          </a>
          {/* Plain <img>: next/image needs the app runtime, which is exactly
              what has failed if this boundary is rendering. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            style={{ display: "block", height: 44, width: "auto" }}
            src="/brand/oceanblue-logo.svg"
            alt="Oceanblue Solutions, Inc."
            width={135}
            height={40}
          />

          <p
            style={{
              margin: "64px 0 0",
              fontSize: 16,
              color: MUTE,
            }}
          >
            Something went wrong
          </p>
          <h1
            style={{
              margin: "20px 0 0",
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              lineHeight: 1,
              letterSpacing: "-0.035em",
              fontWeight: 600,
              maxWidth: "16ch",
            }}
          >
            The site hit an unexpected error.
          </h1>
          <p
            style={{
              margin: "24px 0 0",
              fontSize: 19,
              lineHeight: 1.5,
              maxWidth: "46ch",
              color: MUTE,
            }}
          >
            Reloading usually clears it. If it persists, email{" "}
            <a href="mailto:hr@oceanbluecorp.com" style={{ color: LINK, textDecoration: "underline", textUnderlineOffset: 4 }}>
              hr@oceanbluecorp.com
            </a>{" "}
            and we will take a look.
          </p>

          <button
            type="button"
            onClick={reset}
            onMouseOver={(e) => (e.currentTarget.style.background = ACTION_HOVER)}
            onMouseOut={(e) => (e.currentTarget.style.background = ACTION)}
            style={{
              marginTop: 36,
              minHeight: 48,
              padding: "0 24px",
              border: "none",
              background: ACTION,
              color: "#fff",
              fontSize: 16,
              fontWeight: 500,
              fontFamily: "inherit",
              cursor: "pointer",
              transition: "background .2s ease",
            }}
          >
            Reload the page
          </button>


          {error.digest && (
            <p
              style={{
                margin: "48px 0 0",
                paddingTop: 20,
                borderTop: `1px solid ${LINE}`,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 13,
                color: MUTE,
              }}
            >
              Reference: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
