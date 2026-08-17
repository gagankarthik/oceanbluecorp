import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,

  // ── Redirects ─────────────────────────────────────────────────────────────
  // /services was renamed to /solutions — forward old URLs (and any indexed
  // per-service pages) permanently.
  async redirects() {
    return [
      { source: "/services", destination: "/solutions", permanent: true },
      { source: "/engineering", destination: "/solutions/engineering", permanent: true },
      { source: "/services/:slug", destination: "/solutions/:slug", permanent: true },
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
        hostname: "development.ohio.gov",
        pathname: "/**",
      },
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
