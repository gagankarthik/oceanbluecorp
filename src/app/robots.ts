import { MetadataRoute } from "next";

const BASE = "https://oceanbluecorp.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Main crawler rules — allow all public pages, block private areas
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/services",
          "/products",
          "/careers",
          "/careers/search",
          "/resources",
          "/contact",
          "/privacy",
        ],
        disallow: [
          "/admin/",      // Private HR/admin panel
          "/api/",        // API routes — never index
          "/auth/",       // Auth flows
          "/dashboard/",  // Authenticated user dashboard
          "/_next/",      // Next.js internals
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
