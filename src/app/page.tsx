import Hero from "@/components/landing/Hero";
import ClientLogos from "@/components/landing/ClientLogos";
import Services from "@/components/landing/Services";
import ImpactStats from "@/components/landing/ImpactStats";
import Certifications from "@/components/landing/Certifications";
import Insights from "@/components/landing/Insights";
import CaseStudy from "@/components/landing/CaseStudy";
import Testimonials from "@/components/landing/Testimonials";
import CallToAction from "@/components/landing/CallToAction";
import { getSiteContent } from "@/lib/content";

// Re-read CMS content (edited at /admin/content) at most once a minute, so
// admin edits go live without a rebuild while the page stays effectively static.
export const revalidate = 60;

/* ============================================================
   LANDING — consulting-firm direction (EY / Deloitte / Accenture).
   Light, editorial, photography-led, bold statement type, content
   cards in grids, an Insights section, one decisive Ocean-Blue
   accent, a flat sticky header, and a bold image-backed CTA.
   Order: Hero(image) · Clients · Services · Impact · Insights ·
   Case Study · CTA.
   ============================================================ */

export default async function Home() {
  const content = await getSiteContent("homepage");
  return (
    <div className="horizon relative w-full bg-[var(--hz-canvas)]">
      <Hero content={content} />
      <ClientLogos />
      <Services />
      <ImpactStats content={content} />
      <Certifications />
      <Insights />
      <CaseStudy />
      <Testimonials />
      <CallToAction content={content} />
    </div>
  );
}
