import type { Metadata } from "next";
import { breadcrumbJsonLd, jsonLdString, pageMetadata } from "@/lib/seo";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Closing from "@/components/site/Closing";
import Photo from "@/components/site/Photo";
import { getService, industries, services } from "@/lib/site-content";

export const metadata: Metadata = pageMetadata({
  path: "/industries",
  title: "Industries",
  description:
    "IT staffing, cloud, security, data and engineering talent for government agencies, healthcare, financial services, manufacturing, retail and hospitality.",
});

const looks = [
  { field: "bg-field-paper text-navy-900", soft: "text-mist-600", tone: "light" as const, hover: "hover:text-ocean-700", link: "text-ocean-700" },
  { field: "bg-navy-900 text-mist-50", soft: "text-tide-300", tone: "dark" as const, hover: "hover:text-cyan-300", link: "text-white" },
  { field: "bg-field-mist text-navy-900", soft: "text-mist-600", tone: "light" as const, hover: "hover:text-ocean-700", link: "text-ocean-700" },
  { field: "bg-ocean-600 text-white", soft: "text-white", tone: "brand" as const, hover: "hover:text-cyan-100", link: "text-white" },
  { field: "bg-field-paper text-navy-900", soft: "text-mist-600", tone: "light" as const, hover: "hover:text-ocean-700", link: "text-ocean-700" },
];

// The three highlights are a starting point; name a few more so nobody reads them as the whole offer
// Most-asked-for first, so each sector names the strongest services it doesn't already show
const PRIORITY = ["erp", "salesforce", "managed-services", "ai-data", "cybersecurity", "cloud-engineering", "it-staffing", "digital-transformation", "engineering-talent", "training"];
const alsoFor = (featured: readonly string[]) =>
  PRIORITY.filter((slug) => !featured.includes(slug))
    .slice(0, 3)
    .map((slug) => getService(slug)?.name)
    .filter(Boolean);

export default function IndustriesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd([{ name: "Industries", path: "/industries" }])) }} />
      <PageHero
        cells={[{ photo: "concrete" }, { tone: "bg-navy-900" }, { photo: "tower", position: "50% 70%" }, { tone: "bg-tide-200" }, { photo: "lattice" }, { tone: "bg-ocean-600" }]}
        lines={["Industries", "we serve"]}
        standfirst="Places where delivery, compliance and uptime all matter at once, and where a vendor that disappears after the contract is signed is not an option."
        side={
          <ul className="grid gap-1">
            {industries.map((i) => (
              <li key={i.slug}>
                <a href={`#${i.slug}`} className="text-navy-900 underline decoration-navy-900/30 underline-offset-4 hover:decoration-navy-900">
                  {i.name}
                </a>
              </li>
            ))}
          </ul>
        }
      />

      {industries.map((ind, idx) => {
        const l = looks[idx % looks.length];
        // Alternate sides so the page does not read as one long column
        const flip = idx % 2 === 1;
        const also = alsoFor(ind.services);
        return (
          <section key={ind.slug} id={ind.slug} className={l.field}>
            <div className="gutter grid gap-12 py-24 md:py-32 lg:grid-cols-12 lg:items-center">
              <div className={flip ? "lg:col-span-4 lg:col-start-9 lg:row-start-1" : "lg:col-span-4"} data-reveal>
                <Photo name={ind.photo} className="aspect-[4/5]" position={ind.photo === "plant" ? "0% 50%" : "center"} />
              </div>
              <div className={flip ? "lg:col-span-7 lg:col-start-1 lg:row-start-1" : "lg:col-span-7 lg:col-start-6"}>
                <h2 className="display text-head" data-reveal>
                  {ind.name}
                </h2>
                <p className={`mt-6 max-w-measure-narrow text-title leading-snug ${l.soft}`} data-reveal style={{ "--d": 1 } as React.CSSProperties}>
                  {ind.body}
                </p>
                <p className="mt-12 text-title font-medium" data-reveal style={{ "--d": 2 } as React.CSSProperties}>
                  Where clients in this sector usually start
                </p>
                <ul className="mt-4 grid gap-2" data-reveal style={{ "--d": 2 } as React.CSSProperties}>
                  {ind.services.map((slug) => (
                    <li key={slug}>
                      <Link href={`/services/${slug}`} className={`display text-head-sm transition-colors ${l.hover}`}>
                        {getService(slug)!.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className={`mt-6 max-w-measure-narrow ${l.soft}`} data-reveal style={{ "--d": 3 } as React.CSSProperties}>
                  Need something else? We also offer {also.join(", ")} and the rest of our {services.length} services.{" "}
                  <Link href="/services" className={`font-medium underline underline-offset-4 ${l.link}`}>
                    See all services
                  </Link>
                </p>
              </div>
            </div>
          </section>
        );
      })}

      <Closing
        lines={["Not sure we cover", "what you need?"]}
        sentence={`Tell us the problem. All ${services.length} of our services are open to every sector on this page, and we will say plainly if we are not the right fit.`}
        action="Tell us what you need"
      />
    </>
  );
}
