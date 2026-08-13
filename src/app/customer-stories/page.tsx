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
  //, and add the route to sitemap.xml at the same time.
  robots: { index: false, follow: true },
};

export default function CustomerStories() {
  return (
    <ComingSoon
      eyebrow="Customer stories"
      title="What it is like to work with us."
      subtitle="In our clients' words: what changed, how long it took, and what they would tell a peer."
      note="We publish these only once the client has approved the wording, so there is nothing here yet. If you would rather skip the write-up and speak to a reference directly, we can arrange that."
    />
  );
}
