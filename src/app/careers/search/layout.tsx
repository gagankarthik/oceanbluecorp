import type { Metadata } from "next";
import { OG_IMAGES } from "@/lib/seo";

// The search page itself is a client component, so its SEO metadata lives here.
export const metadata: Metadata = {
  title: "Search Jobs",
  description:
    "Browse and search open roles at Ocean Blue Corporation across IT, cloud, security, and data. Flexible, permanent, and managed-team positions.",
  alternates: { canonical: "https://oceanbluecorp.com/careers/search" },
  openGraph: {
    images: OG_IMAGES,
    title: "Search Jobs | Ocean Blue Corporation",
    description: "Browse and search open roles at Ocean Blue Corporation.",
    url: "https://oceanbluecorp.com/careers/search",
  },
};

export default function CareersSearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
