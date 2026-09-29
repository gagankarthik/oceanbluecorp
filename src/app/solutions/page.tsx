import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import ServicesPage from "./_content";
import { getSiteContent } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  path: "/solutions",
  title: "IT Solutions & Services",
  description: "Enterprise IT from one partner: IT staffing, engineering talent, cloud, cybersecurity, ERP, Salesforce, AI and data, managed services and training.",
});

export default async function Solutions() {
  const content = await getSiteContent("services");
  return <ServicesPage content={content} />;
}
