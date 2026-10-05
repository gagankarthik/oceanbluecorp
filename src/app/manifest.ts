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
    icons: [{ src: "/Logo_400x400.png", sizes: "400x400", type: "image/png", purpose: "any" }],
  };
}
