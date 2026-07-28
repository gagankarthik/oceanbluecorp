import { ImageResponse } from "next/og";

/* ============================================================
   Social share card — 1200×630, generated at build time.
   Replaces the 400×400 logo that forced a small `summary` card;
   this lets X/LinkedIn/Slack render the large-image treatment.
   `twitter-image.tsx` re-exports this so both stay in sync.
   ============================================================ */

export const alt =
  "Ocean Blue Corporation — IT staffing, enterprise solutions, and managed services";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#07142b",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Brand wash, mirroring the hero's cobalt/cyan mesh */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "radial-gradient(60% 70% at 12% 8%, rgba(29,78,216,0.55), transparent 62%), radial-gradient(50% 60% at 96% 92%, rgba(42,216,239,0.22), transparent 64%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
          <div style={{ width: 10, height: 40, borderRadius: 4, background: "#5ce0f7", display: "flex" }} />
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: "#ffffff",
              letterSpacing: "-0.01em",
              display: "flex",
            }}
          >
            Ocean Blue Corporation
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
          <div
            style={{
              fontSize: 66,
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: "-0.035em",
              color: "#ffffff",
              maxWidth: 940,
              display: "flex",
            }}
          >
            The people and platforms behind enterprises and government agencies.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 28,
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.72)",
              maxWidth: 860,
              display: "flex",
            }}
          >
            IT staffing · Enterprise solutions · Managed services
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.16)",
            paddingTop: 26,
            fontSize: 22,
            color: "rgba(255,255,255,0.6)",
            position: "relative",
          }}
        >
          <div style={{ display: "flex" }}>oceanbluecorp.com</div>
          <div style={{ display: "flex" }}>Powell, Ohio · Since 2013</div>
        </div>
      </div>
    ),
    size,
  );
}
