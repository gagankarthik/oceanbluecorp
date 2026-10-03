import Locations from "@/components/landing/Locations";
import { CONTAINER } from "@/components/site/sections";
import { ContactSheet } from "./contact-form";
import type { ContactPath } from "./paths";
import { HR_EMAIL } from "@/lib/careers";

export default function ContactPage({
  content = {},
  initialPath = "hiring",
}: {
  content?: Record<string, string>;
  initialPath?: ContactPath;
}) {
  // Editable in /admin/content; the defaults are the published details.
  const details = {
    phone: content.contactPhone || "+1 (614) 844-6925",
    email: content.contactEmail || HR_EMAIL,
    hours: content.contactHours || "Mon to Fri, 8 AM to 5 PM Eastern",
    address: content.contactAddress || "9775 Fairway Drive, Suite C, Powell, Ohio",
  };
  return (
    <>
      <section data-opener id="contact-form" className="bg-paper pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24">
        <div className={CONTAINER}>
          <ContactSheet initialPath={initialPath} details={details} />
        </div>
      </section>

      {/* Offices, with a map: four pins across three countries reads as coverage at a glance. */}
      <Locations tone="white" />
    </>
  );
}
