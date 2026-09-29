import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import ContactPage from "./_content";
import { getSiteContent } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  path: "/contact",
  title: "Contact Us",
  description: "Talk to Ocean Blue Corporation about IT staffing, enterprise solutions or managed services. Call +1 (614) 844-6925 or email hr@oceanbluecorp.com.",
});

export default async function Contact() {
  const content = await getSiteContent("contact");
  return <ContactPage content={content} />;
}
