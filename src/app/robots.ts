import { MetadataRoute } from "next";

const BASE = "https://oceanbluecorp.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Main crawler rules, allow all public pages, block private areas
      {
        userAgent: "*",
        // Everything is crawlable except the API. /admin, /auth and
        // /maintenance are NOT blocked on purpose: they send noindex (header
        // or meta), and a robots.txt block hides that from Google, which then
        // reports the linked sign-in page as "Blocked by robots.txt" instead
        // of quietly dropping it. /_next/ stays open too: Google renders pages
        // with the JS/CSS under it and indexes images through /_next/image.
        allow: "/",
        disallow: [
          "/api/", // API routes, JSON only, never index
        ],
      },

      // Block heavy scraper bots that offer no indexing value
      {
        userAgent: "AhrefsBot",
        crawlDelay: 10,
      },
      {
        userAgent: "SemrushBot",
        crawlDelay: 10,
      },
      {
        userAgent: "DotBot",
        disallow: ["/"],
      },
      {
        userAgent: "MJ12bot",
        disallow: ["/"],
      },
    ],

    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
