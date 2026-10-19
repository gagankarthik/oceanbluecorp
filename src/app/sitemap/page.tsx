import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { industries, services } from "@/lib/site-content";
import { categories, type Category } from "@/lib/resources";

/* Human sitemap, grouped by errand rather than URL depth. Keep in step with
   STATIC in app/sitemap.xml/route.ts. */

export const metadata: Metadata = pageMetadata({
  path: "/sitemap",
  title: "Site Map",
  description: "Every page on the Oceanblue Solutions, Inc. website in one directory: services, industries, careers, jobs, resources, developer docs and legal documents.",
});

const resourceOrder: Category[] = ["customer-stories", "case-studies", "blog", "news"];

const GROUPS: { group: string; note: string; links: { name: string; href: string }[] }[] = [
  {
    group: "Company",
    note: "Who we are and how to reach us.",
    links: [
      { name: "Home", href: "/" },
      { name: "About us", href: "/about" },
      { name: "How we work", href: "/how-we-work" },
      { name: "Certifications", href: "/certifications" },
      { name: "Contact us", href: "/contact" },
    ],
  },
  {
    group: "Services",
    note: "What we are engaged to do.",
    links: [{ name: "All services", href: "/services" }, ...services.map((s) => ({ name: s.name, href: `/services/${s.slug}` }))],
  },
  {
    group: "Industries",
    note: "The sectors we work in.",
    links: [{ name: "All industries", href: "/industries" }, ...industries.map((i) => ({ name: i.name, href: `/industries/${i.slug}` }))],
  },
  {
    group: "Careers",
    note: "Working here, and what is open.",
    links: [
      { name: "Careers", href: "/careers" },
      { name: "Find a job", href: "/jobs" },
      { name: "Equal opportunity", href: "/equal-opportunity" },
    ],
  },
  {
    group: "Resources",
    note: "Proof, notes from our teams, and press material.",
    links: [
      { name: "All resources", href: "/resources" },
      ...resourceOrder.map((c) => ({ name: categories[c].name, href: `/resources/${c}` })),
      { name: "Media kit", href: "/resources/media-kit" },
      { name: "Brand", href: "/brand" },
    ],
  },
  {
    group: "Products and developers",
    note: "What we build, and how partners connect.",
    links: [
      { name: "Products", href: "/products" },
      { name: "Developers: Job Feed API", href: "/developers" },
      { name: "System status", href: "/status" },
    ],
  },
  {
    group: "Help, legal and privacy",
    note: "Answers, and the documents that govern this site.",
    links: [
      { name: "Security", href: "/security" },
      { name: "Legal & privacy", href: "/legal" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Use", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "Accessibility", href: "/accessibility" },
      { name: "Data deletion", href: "/data-deletion" },
    ],
  },
];

export default function SitemapPage() {
  const total = GROUPS.reduce((n, g) => n + g.links.length, 0);
  return (
    <>
      <header id="top" className="bg-field-paper">
        <div className="gutter grid gap-8 pb-12 pt-14 md:pb-16 md:pt-20 lg:grid-cols-12">
          <p className="side text-mist-600 lg:pt-4">{total} pages</p>
          <h1 className="poster axis text-head-xl">Site map</h1>
          <p className="axis max-w-measure-narrow text-lead leading-snug">Every page on this site, grouped by what you came to do.</p>
        </div>
      </header>

      <section aria-label="All pages" className="bg-field-mist">
        <div className="gutter grid gap-2 py-16 sm:grid-cols-2 md:py-20 lg:grid-cols-3">
          {GROUPS.map((g, i) => (
            <nav key={g.group} aria-label={g.group} className="bg-mist-0 p-7" data-reveal style={{ "--d": i % 3 } as React.CSSProperties}>
              <h2 className="display text-head-sm">{g.group}</h2>
              <p className="mt-1 text-small text-mist-600">{g.note}</p>
              <ul className="mt-5 grid gap-1">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-flex min-h-10 items-center text-navy-900 underline decoration-navy-900/25 underline-offset-4 hover:text-ocean-700 hover:decoration-ocean-700">
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </section>
    </>
  );
}
