import type { Metadata } from "next";
import FaqPage from "./_content";
import { FAQS } from "./questions";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "How Ocean Blue Corporation engages, how fast we shortlist, how our engineers work with your team, what we hold and do not hold on security, and how to reach a person.",
  openGraph: {
    title: "FAQ | Ocean Blue Corporation",
    description:
      "Answers on engagement models, shortlists, security, and working with Ocean Blue.",
    url: "https://oceanbluecorp.com/faq",
  },
  alternates: { canonical: "https://oceanbluecorp.com/faq" },
};

/* FAQPage structured data. Search engines surface these directly, which is
   most of the point of having the page: the answer reaches someone before
   they have to open a tab. Built from the same array the page renders, so the
   markup can never drift from what a visitor sees. */
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function Faq() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FaqPage />
    </>
  );
}
