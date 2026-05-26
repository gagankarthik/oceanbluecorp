import type { Metadata } from "next";
import ServicesPage from "./_content";
import { getSiteContent } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "IT Services",
  description:
    "Explore Ocean Blue Corporation's IT services — IT staffing, cloud, cybersecurity, ERP, Salesforce, AI & data, managed services, and digital transformation. Serving Fortune 500 enterprises and state government agencies across North America.",
  openGraph: {
    title: "Enterprise IT Services | Ocean Blue Corporation",
    description:
      "End-to-end IT services: staffing, cloud, cybersecurity, ERP, Salesforce, AI & data, and managed services.",
    url: "https://oceanbluecorp.com/services",
  },
  alternates: { canonical: "https://oceanbluecorp.com/services" },
};

export default async function Services() {
  const content = await getSiteContent("services");
  return <ServicesPage content={content} />;
}
