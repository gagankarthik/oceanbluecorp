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
  //, and add the route to sitemap.xml at the same time.
  robots: { index: false, follow: true },
};

export default function CaseStudies() {
  return (
    <ComingSoon
      eyebrow="Case studies"
      title="The problem, the team, what changed."
      subtitle="Engagements in full: what was broken, who we put on it, and what it measurably changed."
      note="The first write-ups are in review with the clients involved. Until they are cleared, we are happy to walk you through comparable work on a call."
    />
  );
}
