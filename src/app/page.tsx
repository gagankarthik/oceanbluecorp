import Hero from "@/components/landing/Hero";
import ClientLogos from "@/components/landing/ClientLogos";
import Services from "@/components/landing/Services";
import ImpactStats from "@/components/landing/ImpactStats";
import Certifications from "@/components/landing/Certifications";
import Testimonials from "@/components/landing/Testimonials";
import CallToAction from "@/components/landing/CallToAction";
import { getSiteContent } from "@/lib/content";

// Re-read CMS content (edited at /admin/content) at most once a minute, so
// admin edits go live without a rebuild while the page stays effectively static.
export const revalidate = 60;

/* ============================================================
   LANDING — consulting-firm direction (EY / Deloitte / Accenture).
   Light, editorial, photography-led, bold statement type, content
   cards in grids, one decisive Ocean-Blue accent, a flat sticky
   header, and a bold image-backed CTA. (Insights / Case Study
   sections removed until the Resources content exists.)
   Order: Hero(image) · Clients · Services · Impact · Certifications ·
   Testimonials · CTA.
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
      <Testimonials />
      <CallToAction content={content} />
    </div>
  );
}
