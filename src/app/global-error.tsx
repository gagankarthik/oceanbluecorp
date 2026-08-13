"use client";

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

// --hz-* equivalents, inlined because the stylesheet is not guaranteed here.
const CANVAS = "#ffffff";
const TEXT = "#0f172a";
const MUTE = "#475569";
const SUBTLE = "#64748b";
const LINE = "#e2e8f0";
const COBALT = "#1d4ed8";
const COBALT_600 = "#1740ad";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: CANVAS,
          color: TEXT,
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <main style={{ maxWidth: 720, padding: "80px 24px" }}>
          {/* Plain <img>: next/image needs the app runtime, which is exactly
              what has failed if this boundary is rendering. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Ocean Blue Corporation"
            width={170}
            height={40}
            style={{ height: 32, width: "auto" }}
          />

          <p
            style={{
              margin: "64px 0 0",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontWeight: 500,
              color: COBALT,
            }}
          >
            Something went wrong
          </p>
          <h1
            style={{
              margin: "20px 0 0",
              fontSize: "clamp(1.85rem, 5vw, 2.6rem)",
              lineHeight: 1.06,
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
              fontSize: 17,
              lineHeight: 1.6,
              maxWidth: "46ch",
              color: MUTE,
            }}
          >
            Reloading usually clears it. If it persists, email{" "}
            <a href="mailto:hr@oceanbluecorp.com" style={{ color: COBALT, fontWeight: 600 }}>
              hr@oceanbluecorp.com
            </a>{" "}
            and we will take a look.
          </p>

          <button
            type="button"
            onClick={reset}
            onMouseOver={(e) => (e.currentTarget.style.background = COBALT_600)}
            onMouseOut={(e) => (e.currentTarget.style.background = COBALT)}
            style={{
              marginTop: 36,
              padding: "12px 24px",
              borderRadius: 999,
              border: "none",
              background: COBALT,
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
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
                fontSize: 12,
                color: SUBTLE,
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
