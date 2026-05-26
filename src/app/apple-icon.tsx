import { ImageResponse } from "next/og";

// App Router convention: Next.js serves this at /apple-icon.png and auto-injects
// the <link rel="apple-touch-icon"> tag. Generated so we don't need a static
// square asset (favicon.png is 80×76, logo.png is a wordmark — neither works).
export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(150deg, #1d4ed8 0%, #1740ad 100%)",
          color: "#ffffff",
          fontSize: 92,
          fontWeight: 700,
          letterSpacing: -4,
        }}
      >
        OB
      </div>
    ),
    { ...size }
  );
}
