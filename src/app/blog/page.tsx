import type { Metadata } from "next";
import ComingSoon from "@/components/landing/ComingSoon";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes from Ocean Blue Corporation's engineers and recruiters on IT hiring, delivery, and enterprise platforms.",
  openGraph: {
    title: "Blog | Ocean Blue Corporation",
    description: "Notes from Ocean Blue Corporation's engineers and recruiters on IT hiring, delivery, and enterprise platforms.",
    url: "https://oceanbluecorp.com/blog",
  },
  alternates: { canonical: "https://oceanbluecorp.com/blog" },
  // Deliberate: this section has no entries yet, and four thin pages in an
  // index hurt the domain rather than help it. Remove once real content lands
  //, and add the route to sitemap.xml at the same time.
  robots: { index: false, follow: true },
};

export default function Blog() {
  return (
    <ComingSoon
      eyebrow="Blog"
      title="Notes from the people doing the work."
      subtitle="Our engineers and recruiters write about hiring, delivery, and the platforms we run."
      note="The first pieces are being written. If you have a specific question now, ask us directly and you will get an answer from the person who does the work, not a form response."
    />
  );
}
