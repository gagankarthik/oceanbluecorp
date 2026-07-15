import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// App Router convention: Next.js serves this at /apple-icon.png and auto-injects
// the <link rel="apple-touch-icon"> tag. Renders the Ocean Blue "b" mark on
// white — NOT an "OB" monogram.
export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const data = await readFile(join(process.cwd(), "public", "Logo_400x400.png"));
  const src = `data:image/png;base64,${data.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={160} height={160} alt="Ocean Blue" style={{ objectFit: "contain" }} />
      </div>
    ),
    { ...size }
  );
}
