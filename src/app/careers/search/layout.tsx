import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// SEO metadata for the board. The page is a server component that renders the
// open roles; the interactive board is job-board.tsx.
export const metadata: Metadata = pageMetadata({
  path: "/careers/search",
  title: "Search Open Jobs",
  description: "Search open IT and engineering jobs at Oceanblue Solutions, Inc. Filter by department, location, job type and remote work, then apply online.",
});

export default function CareersSearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
