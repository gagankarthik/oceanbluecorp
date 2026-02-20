import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
    ],
  },
};

export default nextConfig;
