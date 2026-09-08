import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,

  // ── Redirects ─────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // www and the apex both answered 200 with the same body, so every page
      // existed at two URLs. Canonical tags, the sitemap and robots' Host all
      // already name the apex; this makes the server agree instead of leaving
      // Google to work it out (it was reporting the www copies as "Alternate
      // page with proper canonical tag"). Absolute destination, so no loop.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.oceanbluecorp.com" }],
        destination: "https://oceanbluecorp.com/:path*",
        permanent: true,
      },

      // /services was renamed to /solutions — forward old URLs (and any indexed
      // per-service pages) permanently.
      { source: "/services", destination: "/solutions", permanent: true },
      { source: "/engineering", destination: "/solutions/engineering", permanent: true },
      { source: "/services/:slug", destination: "/solutions/:slug", permanent: true },

      // The /resources hub was split into the four publishing sections. Left
      // as bare 404s these stayed in Search Console's coverage report instead
      // of handing their equity to the pages that replaced them.
      { source: "/resources", destination: "/blog", permanent: true },
      { source: "/resources/blog", destination: "/blog", permanent: true },
      { source: "/resources/blog/:slug", destination: "/blog/:slug", permanent: true },
      { source: "/resources/case-studies", destination: "/case-studies", permanent: true },
      { source: "/resources/case-studies/:slug", destination: "/case-studies/:slug", permanent: true },
      { source: "/resources/ebook", destination: "/blog", permanent: true },

      // Public sign-up is gone; the app is invite-only.
      { source: "/auth/signup", destination: "/auth/signin", permanent: true },

      // ── Pre-Next.js URLs ──────────────────────────────────────────────────
      // oceanbluecorp.com ran a DotNetNuke storefront, then a static .html
      // site, then WordPress before this app. Google still holds ~200 of those
      // URLs, which is what Search Console reports as "Not found (404)".
      //
      // Only mapped where a real successor exists. The DNN storefront
      // (/Store/**, **/tabid/NN/**, *.aspx) and the discontinued training line
      // are deliberately left to 404: they have no equivalent here, and
      // pointing them at a loosely-related page is the soft redirect Google
      // discards anyway.

      // Service lines → /solutions
      { source: "/staffing", destination: "/solutions/staffing", permanent: true },
      { source: "/cloud-services", destination: "/solutions/cloud", permanent: true },
      { source: "/data-analytics", destination: "/solutions/ai", permanent: true },
      { source: "/data-analytics-and-ai", destination: "/solutions/ai", permanent: true },
      { source: "/erp", destination: "/solutions/erp", permanent: true },
      { source: "/sap-erp", destination: "/solutions/erp", permanent: true },
      { source: "/oracle-erp", destination: "/solutions/erp", permanent: true },
      { source: "/salesforce-services", destination: "/solutions/salesforce", permanent: true },
      { source: "/managed-services", destination: "/solutions/managed", permanent: true },
      { source: "/managed-services-2", destination: "/solutions/managed", permanent: true },
      { source: "/outsourcing-services", destination: "/solutions/managed", permanent: true },
      { source: "/all-services", destination: "/solutions", permanent: true },
      { source: "/services/item/:slug*", destination: "/solutions", permanent: true },
      // Enumerated, not "/services-:n(\d+)": inside a double-quoted TS string
      // that \d collapses to a literal "d" and the rule silently matches
      // nothing. These are the only numbered duplicates the old site left.
      { source: "/services-2", destination: "/solutions", permanent: true },
      { source: "/services-3", destination: "/solutions", permanent: true },
      { source: "/services-4", destination: "/solutions", permanent: true },
      { source: "/services-5", destination: "/solutions", permanent: true },
      { source: "/solution", destination: "/solutions", permanent: true },
      { source: "/solution-2", destination: "/solutions", permanent: true },
      { source: "/solution-3", destination: "/solutions", permanent: true },
      { source: "/our-process", destination: "/solutions", permanent: true },

      // The WordPress-era job board → the live one
      { source: "/jobs/:path*", destination: "/careers/search", permanent: true },
      { source: "/job/:path*", destination: "/careers/search", permanent: true },

      // WordPress taxonomy and content archives → the sections that replaced them
      { source: "/category/:slug*", destination: "/blog", permanent: true },
      { source: "/tag/:slug*", destination: "/blog", permanent: true },
      { source: "/author/:slug*", destination: "/blog", permanent: true },
      { source: "/ebooks", destination: "/blog", permanent: true },
      { source: "/ebooks/:slug*", destination: "/blog", permanent: true },
      { source: "/ebooks_category/:slug*", destination: "/blog", permanent: true },
      { source: "/cases/:slug*", destination: "/case-studies", permanent: true },
      { source: "/case-category/:slug*", destination: "/case-studies", permanent: true },
      { source: "/portfolio/:slug*", destination: "/case-studies", permanent: true },
      { source: "/team/item/:slug*", destination: "/team", permanent: true },

      // Static .html site
      { source: "/about.html", destination: "/about", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/about-us-2", destination: "/about", permanent: true },
      { source: "/careers.html", destination: "/careers", permanent: true },
      { source: "/contact.html", destination: "/contact", permanent: true },
      { source: "/clients", destination: "/about", permanent: true },
      { source: "/clients.html", destination: "/about", permanent: true },
      { source: "/terms-and-conditions", destination: "/terms", permanent: true },
    ];
  },

  // ── Security headers ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options",           value: "SAMEORIGIN" },
          // Prevent MIME sniffing
          { key: "X-Content-Type-Options",    value: "nosniff" },
          // Control referrer information
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          // Limit browser feature access
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=(), payment=()" },
          // Enable DNS prefetching for performance
          { key: "X-DNS-Prefetch-Control",    value: "on" },
          // Force HTTPS (2 years)
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      // Additional headers for API routes
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Cache-Control",          value: "no-store, max-age=0" },
        ],
      },
      // /public assets reach the browser with a 5s TTL otherwise, so every
      // client mark is re-fetched on the next page.
      //
      // Split by how the file changes, not by extension. Marks under /logos
      // are replaced under a new name when a brand changes (aws-partner.png ->
      // aws-partner-trimmed.png), so they are safe to freeze. /images holds
      // named slots like hero-bg.png that do get overwritten in place, so those
      // get a month, long enough for the audit and short enough that a swap
      // lands. (Most /images reads go through /_next/image anyway, which sets
      // its own TTL from `minimumCacheTTL` below.)
      {
        source: "/logos/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
      {
        source: "/:file(favicon.png|logo.png|logo.webp|manifest.json)",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
    ];
  },

  // ── Environment variables (server-side AWS config) ────────────────────────
  env: {
    NEXT_AWS_ACCESS_KEY_ID:               process.env.NEXT_AWS_ACCESS_KEY_ID,
    NEXT_AWS_SECRET_ACCESS_KEY:           process.env.NEXT_AWS_SECRET_ACCESS_KEY,
    NEXT_PUBLIC_AWS_REGION:               process.env.NEXT_PUBLIC_AWS_REGION,
    NEXT_AWS_S3_BUCKET_NAME:              process.env.NEXT_AWS_S3_BUCKET_NAME,
    NEXT_AWS_S3_BUCKET_REGION:            process.env.NEXT_AWS_S3_BUCKET_REGION,
    NEXT_AWS_DYNAMODB_TABLE_RESUMES:      process.env.NEXT_AWS_DYNAMODB_TABLE_RESUMES,
    NEXT_AWS_DYNAMODB_TABLE_APPLICATIONS: process.env.NEXT_AWS_DYNAMODB_TABLE_APPLICATIONS,
    NEXT_AWS_DYNAMODB_TABLE_JOBS:         process.env.NEXT_AWS_DYNAMODB_TABLE_JOBS,
    NEXT_AWS_DYNAMODB_TABLE_CONTACTS:     process.env.NEXT_AWS_DYNAMODB_TABLE_CONTACTS,
    NEXT_AWS_DYNAMODB_TABLE_CANDIDATES:   process.env.NEXT_AWS_DYNAMODB_TABLE_CANDIDATES,
  },

  // ── Image optimization ────────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oceanbluecorp.com",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "www.oceanbluecorp.com",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      // Client wordmarks hotlinked from the client's own site. Allowed so
      // next/image can resize them down to the ~130px slot they render in.
      {
        protocol: "https",
        hostname: "www.satyawholesalers.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.inytes.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.gstatic.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
