import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Oceanblue Solutions, Inc.",
    short_name: "Oceanblue",
    description: "IT staffing, enterprise solutions, and managed services.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    // Matches `viewport.themeColor` in the root layout.
    theme_color: "#0b1a33",
    icons: [{ src: "/brand/oceanblue-mark-512.png", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
