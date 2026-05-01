import type { Metadata } from "next";
import CareersPage from "./_content";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Explore career opportunities at Ocean Blue Corporation. We connect top IT talent with enterprise roles in ERP, cloud, AI, Salesforce, and more. Search and apply for open positions today.",
  openGraph: {
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
