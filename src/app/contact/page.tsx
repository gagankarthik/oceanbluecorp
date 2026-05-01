import type { Metadata } from "next";
import ContactPage from "./_content";

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

export default function Contact() {
  return <ContactPage />;
}
