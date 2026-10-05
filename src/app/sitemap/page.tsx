import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { CONTAINER, OPENER_Y, SECTION_Y } from "@/components/site/sections";
import { IconBuilding, IconLayers, IconBriefcase, IconNewspaper, IconDocsCode, IconArrowRight, type Icon, type IconProps } from "@/components/site/icons";

/** Legal and help: a balance scale, same grid and stroke as site/icons. */
const IconScale = ({ size = 16, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    <path d="M12 4v16M7.5 20h9M5 7h14M5 7l-2.5 6a3 3 0 0 0 5 0L5 7ZM19 7l-2.5 6a3 3 0 0 0 5 0L19 7Z" />
  </svg>
);

/**
 * Human sitemap.
 *
 * The previous version listed four groups as bare columns of blue text and was
 * missing a third of the site: no blog, no news, no case studies, no customer
 * stories, and FAQ filed under Legal. Every link also carried a dark ink
 * background on a light page, which drew a black chip behind each one.
 *
 * Grouped by errand rather than by URL depth, because somebody who opens a
 * sitemap is looking for a page they could not find in the nav, and the nav is
 * organised by product, not by what they came to do.
 */

export const metadata: Metadata = pageMetadata({
  path: "/sitemap",
  title: "Site Map",
  description: "Every page on the Oceanblue Solutions, Inc. website in one directory: solutions, careers, products, insights, developer resources and legal documents.",
});

type Group = {
  group: string;
  note: string;
  icon: Icon;
  links: { name: string; href: string }[];
};

const SECTIONS: Group[] = [
  {
    group: "Company",
    note: "Who we are and how to reach us.",
    icon: IconBuilding,
    links: [
      { name: "Home", href: "/" },
      { name: "About us", href: "/about" },
      { name: "Our team", href: "/team" },
      { name: "Products", href: "/products" },
      { name: "Contact us", href: "/contact" },
    ],
  },
  {
    group: "Solutions",
    note: "What we are engaged to do.",
    icon: IconLayers,
    links: [
      { name: "All solutions", href: "/solutions" },
      { name: "IT staffing & talent", href: "/solutions/staffing" },
      { name: "Engineering talent & services", href: "/solutions/engineering" },
      { name: "Cloud engineering", href: "/solutions/cloud" },
      { name: "Cybersecurity", href: "/solutions/cybersecurity" },
      { name: "ERP solutions", href: "/solutions/erp" },
      { name: "Salesforce services", href: "/solutions/salesforce" },
      { name: "AI & data intelligence", href: "/solutions/ai" },
      { name: "Managed services", href: "/solutions/managed" },
      { name: "Training & upskilling", href: "/solutions/training" },
      { name: "Digital transformation", href: "/solutions/transformation" },
    ],
  },
  {
    group: "Careers",
    note: "Working here, and what is open.",
    icon: IconBriefcase,
    links: [
      { name: "Careers", href: "/careers" },
      { name: "Open positions", href: "/careers/search" },
    ],
  },
  {
    group: "Insights",
    note: "What we have written and shipped.",
    icon: IconNewspaper,
    links: [
      { name: "Blog", href: "/blog" },
      { name: "News", href: "/news" },
      { name: "Case studies", href: "/case-studies" },
      { name: "Customer stories", href: "/customer-stories" },
    ],
  },
  {
    group: "Developers",
    note: "Build against us, or use our marks.",
    icon: IconDocsCode,
    links: [
      { name: "Developer documentation", href: "/developers" },
      { name: "Brand kit", href: "/brand-kit" },
      { name: "System status", href: "/status" },
    ],
  },
  {
    group: "Legal and help",
    note: "The documents, and answers to the usual questions.",
    icon: IconScale,
    links: [
      { name: "FAQ", href: "/faq" },
      { name: "Legal and privacy", href: "/legal" },
      { name: "Privacy policy", href: "/privacy" },
      { name: "Terms of service", href: "/terms" },
      { name: "Cookie policy", href: "/cookies" },
      { name: "Data deletion", href: "/data-deletion" },
      { name: "Accessibility", href: "/accessibility" },
      { name: "Security", href: "/security" },
    ],
  },
];

const TOTAL = SECTIONS.reduce((n, s) => n + s.links.length, 0);

export default function SitemapPage() {
  return (
    <>
      {/* Utility header, not a marketing one. An index is asked two things:
          how many pages, and where the machine-readable copy is. */}
      <header data-opener className="border-b border-line bg-white">
        <div className={`${CONTAINER} ${OPENER_Y} grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-16`}>
          <div>
            <p className="rise type-label font-semibold text-cobalt">Site map</p>
            <h1 className="rise mt-3 max-w-[18ch] type-headline-lg font-semibold text-ink" style={{ animationDelay: "80ms" }}>
              Every page, in one directory.
            </h1>
            <p className="rise mt-5 max-w-[62ch] type-body text-ink-muted" style={{ animationDelay: "160ms" }}>
              Grouped by what you came here to do rather than by how the URLs nest.
            </p>
          </div>
          <dl className="rise grid grid-cols-3 divide-x divide-line overflow-hidden rounded-2xl border border-line" style={{ animationDelay: "220ms" }}>
            <div className="p-5">
              <dt className="type-caption text-ink-subtle">Pages</dt>
              <dd className="mt-1 type-headline-sm font-semibold tabular-nums text-ink">{TOTAL}</dd>
            </div>
            <div className="p-5">
              <dt className="type-caption text-ink-subtle">Sections</dt>
              <dd className="mt-1 type-headline-sm font-semibold tabular-nums text-ink">{SECTIONS.length}</dd>
            </div>
            <div className="min-w-0 p-5">
              <dt className="type-caption text-ink-subtle">For crawlers</dt>
              <dd className="mt-2">
                <a href="/sitemap.xml" className="font-mono text-[14px] font-semibold break-all text-cobalt underline underline-offset-4">
                  /sitemap.xml
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <section data-tone="paper" className={`bg-paper ${SECTION_Y}`}>
        <div className={CONTAINER}>
          <div className="reveal grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2 xl:grid-cols-3">
            {SECTIONS.map((s) => (
              <section key={s.group} className="bg-white p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line text-cobalt">
                    <s.icon size={20} />
                  </span>
                  <div>
                    <h2 className="type-title-lg font-semibold text-ink">{s.group}</h2>
                    <p className="mt-1 type-body-sm text-ink-subtle">{s.note}</p>
                  </div>
                </div>
                <ul className="mt-5 divide-y divide-line border-t border-line">
                  {s.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="group flex min-h-11 items-center justify-between gap-4 py-2 type-body text-ink transition-colors hover:text-cobalt">
                        <span>{l.name}</span>
                        {/* The path is why someone is here rather than in the nav, so it shows. */}
                        <span className="flex items-center gap-2 font-mono text-[12.5px] text-ink-subtle group-hover:text-cobalt">
                          <span className="hidden sm:inline">{l.href}</span>
                          <IconArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
