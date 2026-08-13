import type { Metadata } from "next";
import Hero from "@/components/landing/Hero";
import Services from "@/components/landing/Services";
import Partnerships from "@/components/landing/Partnerships";
import Credentials from "@/components/landing/Credentials";
import Testimonials from "@/components/landing/Testimonials";
import CallToAction from "@/components/landing/CallToAction";
import FilmSection from "@/components/landing/FilmSection";
import CertificationStrip from "@/components/landing/CertificationStrip";
import Anniversary from "@/components/landing/anniversary/Anniversary";

import { getSiteContent } from "@/lib/content";
import { isAnniversaryLive } from "@/lib/anniversary";

// Re-read CMS content (edited at /admin/content) at most once a minute, so
// admin edits go live without a rebuild while the page stays effectively static.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Enterprise IT Solutions, Staffing & Managed Services",
  description:
    "IT and engineering staffing, enterprise solutions, and 24/7 managed services for enterprises and government agencies. Certified MBE/WBE, based in Powell, Ohio.",
  alternates: { canonical: "/" },
};

// The Organization node lives in the root layout; these page-level nodes give
// search engines the sitelinks and services graph.
const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://oceanbluecorp.com/#website",
      url: "https://oceanbluecorp.com",
      name: "Ocean Blue Corporation",
      publisher: { "@id": "https://oceanbluecorp.com/#organization" },
      inLanguage: "en-US",
    },
    {
      "@type": "WebPage",
      "@id": "https://oceanbluecorp.com/#webpage",
      url: "https://oceanbluecorp.com",
      name: "Ocean Blue Corporation | Enterprise IT Solutions",
      isPartOf: { "@id": "https://oceanbluecorp.com/#website" },
      about: { "@id": "https://oceanbluecorp.com/#organization" },
      description:
        "IT and engineering staffing, enterprise solutions, and managed services for enterprises and state government agencies across North America.",
    },
    {
      "@type": "ItemList",
      name: "Solutions",
      itemListElement: [
        { name: "IT Staffing & Talent", url: "https://oceanbluecorp.com/solutions/staffing" },
        { name: "Engineering Talent & Services", url: "https://oceanbluecorp.com/solutions/engineering" },
        { name: "Enterprise Solutions", url: "https://oceanbluecorp.com/solutions/cloud" },
        { name: "Managed Services", url: "https://oceanbluecorp.com/solutions/managed" },
      ].map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: s.name,
        url: s.url,
      })),
    },
  ],
};

export default async function Home() {
  const content = await getSiteContent("homepage");
  // Resolved on the server and passed down. A client component reading the
  // clock itself would let server and browser disagree across midnight and
  // break hydration.
  const anniversary = isAnniversaryLive(content);
  return (
    <div className="horizon relative w-full bg-[var(--hz-canvas)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />

      {anniversary && <Anniversary content={content} />}
      <Hero content={content} />
      <Credentials />
      <Services />
      <Partnerships />
      <Testimonials />
      <FilmSection />
      <CertificationStrip />
      <CallToAction content={content} />
    </div>
  );
}
