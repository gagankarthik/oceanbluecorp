import type { Metadata } from "next";
import { OG_IMAGES } from "@/lib/seo";
import CareersPage from "./_content";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Explore IT careers at Ocean Blue Corporation. Enterprise roles in ERP, cloud, AI, Salesforce, and staffing. Search and apply for open positions today.",
  openGraph: {
    images: OG_IMAGES,
    title: "IT Career Opportunities | Ocean Blue Corporation",
    description:
      "Find your next enterprise IT role. Open positions in ERP, cloud, AI, Salesforce, and staffing.",
    url: "https://oceanbluecorp.com/careers",
  },
  alternates: { canonical: "https://oceanbluecorp.com/careers" },
};

export default function Careers() {
  return <CareersPage />;
}
