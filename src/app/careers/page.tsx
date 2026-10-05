import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import CareersPage from "./_content";

export const metadata: Metadata = pageMetadata({
  path: "/careers",
  title: "IT Jobs & Careers",
  description: "Find IT, engineering and consulting jobs with Oceanblue Solutions, Inc. Contract and full-time roles across the US, including remote positions.",
});

export default function Careers() {
  return <CareersPage />;
}
