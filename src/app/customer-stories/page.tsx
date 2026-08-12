import type { Metadata } from "next";
import ComingSoon from "@/components/landing/ComingSoon";

export const metadata: Metadata = {
  title: "Customer stories",
  description:
    "Client accounts of working with Ocean Blue Corporation on IT staffing, engineering, and managed services.",
  openGraph: {
    title: "Customer stories | Ocean Blue Corporation",
    description: "Client accounts of working with Ocean Blue Corporation on IT staffing, engineering, and managed services.",
    url: "https://oceanbluecorp.com/customer-stories",
  },
  alternates: { canonical: "https://oceanbluecorp.com/customer-stories" },
  // Deliberate: this section has no entries yet, and four thin pages in an
  // index hurt the domain rather than help it. Remove once real content lands
  // — and add the route to sitemap.xml at the same time.
  robots: { index: false, follow: true },
};

export default function CustomerStories() {
  return (
    <ComingSoon
      eyebrow="Customer stories"
      title="How clients describe working with us."
      subtitle="In their words: what changed, how long it took, and what they would tell a peer."
      note="We are collecting these with our clients' approval rather than publishing anything unreviewed. If you would like to speak with a reference directly, we can arrange it."
    />
  );
}
