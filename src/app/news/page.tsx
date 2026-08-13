import type { Metadata } from "next";
import ComingSoon from "@/components/landing/ComingSoon";

export const metadata: Metadata = {
  title: "News",
  description:
    "Company announcements, awards, certifications, and updates from Ocean Blue Corporation.",
  openGraph: {
    title: "News | Ocean Blue Corporation",
    description: "Company announcements, awards, certifications, and updates from Ocean Blue Corporation.",
    url: "https://oceanbluecorp.com/news",
  },
  alternates: { canonical: "https://oceanbluecorp.com/news" },
  // Deliberate: this section has no entries yet, and four thin pages in an
  // index hurt the domain rather than help it. Remove once real content lands
  //, and add the route to sitemap.xml at the same time.
  robots: { index: false, follow: true },
};

export default function News() {
  return (
    <ComingSoon
      eyebrow="News"
      title="Announcements, certifications, milestones."
      subtitle="What is changing here: new certifications, new delivery capacity, new work."
      note="Nothing posted yet. For press or partnership enquiries, contact us and we will come straight back to you."
    />
  );
}
