"use client";

/* ============================================================
   Root error boundary. This one replaces the entire document
   (including the root layout), so it cannot depend on the layout
   fonts, providers, or globals.css being applied, everything
   here is inline and self-contained on purpose.

   It only fires when the root layout itself throws; ordinary
   route errors are handled by error.tsx.
   ============================================================ */

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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#07142b",
          color: "#fff",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <main style={{ maxWidth: 620, padding: "48px 24px" }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            Ocean Blue Corporation
          </p>
          <h1
            style={{
              margin: "20px 0 0",
              fontSize: "clamp(1.9rem, 5vw, 2.75rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.035em",
              fontWeight: 600,
            }}
          >
            The site hit an unexpected error.
          </h1>
          <p
            style={{
              margin: "20px 0 0",
              fontSize: 16,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            Reloading usually clears it. If it persists, email{" "}
            <a href="mailto:hr@oceanbluecorp.com" style={{ color: "#5ce0f7" }}>
              hr@oceanbluecorp.com
            </a>{" "}
            and we&rsquo;ll take a look.
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 32,
              padding: "12px 24px",
              borderRadius: 999,
              border: "none",
              background: "#1d4ed8",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload the page
          </button>

          {error.digest && (
            <p
              style={{
                margin: "40px 0 0",
                paddingTop: 20,
                borderTop: "1px solid rgba(255,255,255,0.15)",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
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
