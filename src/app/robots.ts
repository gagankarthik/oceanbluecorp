import { MetadataRoute } from "next";

const BASE = "https://oceanbluecorp.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Main crawler rules, allow all public pages, block private areas
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/solutions",
          "/solutions/engineering",
          "/products",
          "/careers",
          "/careers/search",
          "/contact",
          "/privacy",
        ],
        // No trailing slash on /admin and /auth, so the bare paths are covered
        // too. /_next/ is deliberately NOT blocked: Google renders pages with
        // the JS/CSS under it and indexes images through /_next/image.
        disallow: [
          "/admin",       // Private HR/admin panel
          "/api/",        // API routes, never index
          "/auth",        // Auth flows
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
