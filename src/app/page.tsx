import type { Metadata } from "next";
import Hero from "@/components/landing/Hero";
import ClientLogos from "@/components/landing/ClientLogos";
import Services from "@/components/landing/Services";
import ImpactStats from "@/components/landing/ImpactStats";
import Certifications from "@/components/landing/Certifications";
import Testimonials from "@/components/landing/Testimonials";
import CallToAction from "@/components/landing/CallToAction";
import { IMG, atWidth } from "@/components/landing/media";
import { getSiteContent } from "@/lib/content";

// Re-read CMS content (edited at /admin/content) at most once a minute, so
// admin edits go live without a rebuild while the page stays effectively static.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Enterprise IT Solutions, Staffing & Managed Services",
  description:
    "Ocean Blue Corporation delivers IT and engineering staffing, enterprise solutions, and 24/7 managed services to enterprises and state government agencies across North America. Certified MBE/WBE, headquartered in Powell, Ohio.",
  alternates: { canonical: "/" },
};

/* ============================================================
   LANDING — consulting-firm direction (EY / Deloitte / Accenture).
   Light, editorial, photography-led, bold statement type, content
   cards in grids, one decisive Ocean-Blue accent, a flat sticky
   header, and a bold image-backed CTA. (Insights / Case Study
   sections removed until the Resources content exists.)
   Order: Hero(image) · Clients · Services · Impact · Certifications ·
   Testimonials · CTA.
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
  return (
    <div className="horizon relative w-full bg-[var(--hz-canvas)]">
      {/* Warm up the LCP hero photo before React hydrates. imageSrcSet mirrors
          the Hero's own ladder so the preload matches the request it makes. */}
      <link
        rel="preload"
        as="image"
        href={IMG.heroSlides[0]}
        imageSrcSet={[640, 960, 1280, 1600, 2000]
          .map((w) => `${atWidth(IMG.heroSlides[0], w)} ${w}w`)
          .join(", ")}
        imageSizes="100vw"
        fetchPriority="high"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />

      <Hero content={content} />
      <ClientLogos />
      <Services />
      <ImpactStats content={content} />
      <Certifications />
      <Testimonials />
      <CallToAction content={content} />
    </div>
  );
}
