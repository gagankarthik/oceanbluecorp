import type { Metadata } from "next";
import { OG_IMAGES } from "@/lib/seo";
import ServicesPage from "./_content";
import { getSiteContent } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "IT staffing, engineering talent, cloud, cybersecurity, ERP, Salesforce, AI and data, managed services, and digital transformation, under one accountable team.",
  openGraph: {
    images: OG_IMAGES,
    title: "Enterprise Solutions | Ocean Blue Corporation",
    description:
      "End-to-end solutions: staffing, engineering, cloud, cybersecurity, ERP, Salesforce, AI & data, and managed services.",
    url: "https://oceanbluecorp.com/solutions",
  },
  alternates: { canonical: "https://oceanbluecorp.com/solutions" },
};

export default async function Solutions() {
  const content = await getSiteContent("services");
  return <ServicesPage content={content} />;
}
