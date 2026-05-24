import type { Metadata } from "next";
import ContactPage from "./_content";
import { getSiteContent } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Ocean Blue Corporation. Reach our team for enterprise IT consulting, staffing inquiries, partnership opportunities, or general support.",
  openGraph: {
    title: "Contact Ocean Blue Corporation",
    description:
      "Reach our team for IT consulting, staffing inquiries, partnerships, or general support.",
    url: "https://oceanbluecorp.com/contact",
  },
  alternates: { canonical: "https://oceanbluecorp.com/contact" },
};

export default async function Contact() {
  const content = await getSiteContent("contact");
  return <ContactPage content={content} />;
}
