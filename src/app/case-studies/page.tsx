import type { Metadata } from "next";
import ComingSoon from "@/components/landing/ComingSoon";

export const metadata: Metadata = {
  title: "Case studies",
  description:
    "Detailed accounts of Ocean Blue Corporation engagements, including scope, delivery, and measured outcomes.",
  openGraph: {
    title: "Case studies | Ocean Blue Corporation",
    description: "Detailed accounts of Ocean Blue Corporation engagements, including scope, delivery, and measured outcomes.",
    url: "https://oceanbluecorp.com/case-studies",
  },
  alternates: { canonical: "https://oceanbluecorp.com/case-studies" },
  // Deliberate: this section has no entries yet, and four thin pages in an
  // index hurt the domain rather than help it. Remove once real content lands
  // — and add the route to sitemap.xml at the same time.
  robots: { index: false, follow: true },
};

export default function CaseStudies() {
  return (
    <ComingSoon
      eyebrow="Case studies"
      title="Engagements in detail, with the outcomes."
      subtitle="The problem, the team we put on it, what we shipped, and what it measurably changed."
      note="The first write-ups are in review with the clients involved. Until they are cleared for publication, we are happy to walk you through comparable work on a call."
    />
  );
}
