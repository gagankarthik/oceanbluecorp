import { ImageResponse } from "next/og";
import { BRAND_NAME, FOUNDED_SHORT, FOUNDED_YEAR, yearsThrough } from "@/lib/company";
import {
  ANNIVERSARY_COPY,
  ANNIVERSARY_SPAN,
  ANNIVERSARY_YEAR,
  ANNIVERSARY_YEARS,
} from "@/lib/anniversary";

/* ============================================================
   TEMPORARY, social card for /13-years, 1200×630.

   Deliberately light and cobalt rather than the site's usual
   dark card: it mirrors the celebration artwork, so the link
   preview and the post it is shared alongside read as one piece.

   Satori (next/og) renders a strict flexbox subset, every
   element with children carries an explicit `display`, and there
   are no background-clip/text-shadow tricks here because their
   support varies by satori version and a card that silently
   renders wrong is worse than a plain one.
   ============================================================ */

export const alt = `${ANNIVERSARY_COPY.heading} , ${ANNIVERSARY_COPY.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const YEARS = yearsThrough(ANNIVERSARY_YEAR);

export default function AnniversaryOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "54px 72px",
          background: "#f5f8fd",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Soft cobalt wash in the corners, echoing the artwork's ground */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "radial-gradient(52% 60% at 6% 0%, rgba(29,78,216,0.14), transparent 62%), radial-gradient(48% 58% at 100% 100%, rgba(42,216,239,0.16), transparent 64%)",
          }}
        />

        {/* Brand row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 9, height: 34, borderRadius: 4, background: "#1d4ed8", display: "flex" }} />
            <div style={{ fontSize: 24, fontWeight: 600, color: "#0f172a", display: "flex" }}>
              {BRAND_NAME}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 17,
              letterSpacing: 2,
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            Est. {FOUNDED_YEAR}
          </div>
        </div>

        {/* The mark */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 250,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.06em",
              color: "#1d4ed8",
            }}
          >
            {ANNIVERSARY_YEARS}
          </div>
          <div style={{ display: "flex", width: 132, height: 5, borderRadius: 3, background: "#2ad8ef", marginTop: 14 }} />
          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 52,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: "#0f172a",
            }}
          >
            {ANNIVERSARY_COPY.heading}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 16,
              fontSize: 26,
              color: "#1d4ed8",
              fontWeight: 500,
            }}
          >
            {ANNIVERSARY_COPY.tagline}
          </div>
        </div>

        {/* Year rail + footer */}
        <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 14,
              fontSize: 18,
              color: "#94a3b8",
            }}
          >
            {YEARS.map((y) => (
              <div
                key={y}
                style={{
                  display: "flex",
                  color: y === ANNIVERSARY_YEAR ? "#1d4ed8" : "#94a3b8",
                  fontWeight: y === ANNIVERSARY_YEAR ? 700 : 400,
                }}
              >
                {y}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(15,23,42,0.10)",
              marginTop: 24,
              paddingTop: 22,
              fontSize: 20,
              color: "#64748b",
            }}
          >
            <div style={{ display: "flex" }}>oceanbluecorp.com</div>
            <div style={{ display: "flex" }}>
              Founded {FOUNDED_SHORT} · {ANNIVERSARY_SPAN}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
