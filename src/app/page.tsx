import type { Metadata } from "next";
import Hero from "@/components/landing/Hero";
import Services from "@/components/landing/Services";
import Partnerships from "@/components/landing/Partnerships";
import Credentials from "@/components/landing/Credentials";
import Testimonials from "@/components/landing/Testimonials";
import CallToAction from "@/components/landing/CallToAction";
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

/* ============================================================
   LANDING — consulting-firm direction (EY / Deloitte / Accenture).
   Light, editorial, photography-led, bold statement type, content
   cards in grids, one decisive Ocean-Blue accent, a flat sticky
   header, and a bold image-backed CTA. (Insights / Case Study
   sections removed until the Resources content exists.)
   Order: Hero (video) · Services · Partnerships (the one dark beat)
   · Clients · Client work (case-study rows) · Accreditation strip ·
   Careers CTA · Footer.
   ============================================================ */

// WebSite + a service ItemList. The Organization node lives in the root layout;
// these are page-level and give search engines the sitelinks/services graph.
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
  // TEMPORARY (13-year celebration). Evaluated here, on the server, and passed
  // down — a client component reading the clock itself would let the server and
  // the browser disagree across midnight and blow up hydration.
  const anniversary = isAnniversaryLive(content);
  return (
    <div className="horizon relative w-full bg-[var(--hz-canvas)]">
      {/* The hero photo preload that used to sit here is gone with the photo.
          The hero is film now, deliberately deferred until after `load`, and
          its LCP element is the CSS-animated headline already in this HTML —
          so a high-priority image preload was spending the opening bandwidth
          on a file the page no longer requests at all. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />

      {/* TEMPORARY — for the celebration the anniversary band leads the page
          and the hero sits beneath it. Removing the band restores the original
          order with no other edit. */}
      {anniversary && <Anniversary content={content} />}
      <Hero content={content} />
      <Services />
      {/* The one dark beat between the hero and the close. */}
      <Partnerships />
      {/* Clients and accreditations behind one pair of tabs — who vouches for
          you, asked once, with the visitor choosing which evidence they care
          about. */}
      <Credentials />
      <Testimonials />
      {/* The trust strip sits ABOVE the closing ask, not below it — the last
          reassurance a reader passes before deciding. */}
      <CertificationStrip />
      <CallToAction content={content} />
    </div>
  );
}
