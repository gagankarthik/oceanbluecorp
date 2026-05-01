import type { Metadata } from "next";
import ServicesPage from "./_content";

export const metadata: Metadata = {
  title: "IT Services",
  description:
    "Explore Ocean Blue Corporation's enterprise IT services — ERP implementation, cloud migration, AI & data analytics, Salesforce CRM, IT staffing, and corporate training. End-to-end digital transformation.",
  openGraph: {
    title: "Enterprise IT Services | Ocean Blue Corporation",
    description:
      "End-to-end IT services: ERP, cloud, AI analytics, Salesforce, IT staffing, and corporate training.",
    url: "https://oceanbluecorp.com/services",
  },
  alternates: { canonical: "https://oceanbluecorp.com/services" },
};

export default function Services() {
  return <ServicesPage />;
}
