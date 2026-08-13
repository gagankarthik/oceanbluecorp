import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2, Layers, Briefcase, Newspaper, Code2, Scale,
  type LucideIcon,
} from "lucide-react";
import { Stagger, StaggerItem } from "@/components/landing/motion/Primitives";

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

export const metadata: Metadata = {
  title: "Site map",
  description:
    "Every page on the Ocean Blue Corporation website in one directory: solutions, careers, products, insights, developer resources and legal documents.",
  openGraph: {
    title: "Site map | Ocean Blue Corporation",
    description:
      "A directory of every page on oceanbluecorp.com, grouped by what you came to do.",
    url: "https://oceanbluecorp.com/sitemap",
  },
  alternates: { canonical: "https://oceanbluecorp.com/sitemap" },
};

type Group = {
  group: string;
  note: string;
  icon: LucideIcon;
  links: { name: string; href: string }[];
};

const SECTIONS: Group[] = [
  {
    group: "Company",
    note: "Who we are and how to reach us.",
    icon: Building2,
    links: [
      { name: "Home", href: "/" },
      { name: "About us", href: "/about" },
      { name: "Our team", href: "/team" },
      { name: "Products", href: "/products" },
      { name: "Thirteen years", href: "/13-years" },
      { name: "Connect with us", href: "/contact" },
    ],
  },
  {
    group: "Solutions",
    note: "What we are engaged to do.",
    icon: Layers,
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
      { name: "Digital transformation", href: "/solutions/transformation" },
    ],
  },
  {
    group: "Careers",
    note: "Working here, and what is open.",
    icon: Briefcase,
    links: [
      { name: "Careers", href: "/careers" },
      { name: "Open positions", href: "/careers/search" },
    ],
  },
  {
    group: "Insights",
    note: "What we have written and shipped.",
    icon: Newspaper,
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
    icon: Code2,
    links: [
      { name: "Developer documentation", href: "/developers" },
      { name: "Brand kit", href: "/brand-kit" },
      { name: "System status", href: "/status" },
    ],
  },
  {
    group: "Legal and help",
    note: "The documents, and answers to the usual questions.",
    icon: Scale,
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
    <div className="horizon min-h-screen w-full bg-[var(--hz-canvas)]">
      {/* Utility header, not a marketing one. This page is an index, so it
          opens with the two things an index is asked for — how many pages and
          where the machine-readable copy is — and gets out of the way. The
          legal index next door is deliberately set differently: that one is
          read, this one is scanned. */}
      <header className="w-full border-b border-[var(--hz-line)] px-6 pb-10 pt-28 sm:px-10 sm:pt-32 lg:px-16 2xl:px-24">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div>
            <p className="hz-eyebrow text-[var(--hz-text-subtle)]">Site map</p>
            <h1 className="hz-display mt-4 max-w-[18ch] text-[clamp(2rem,4.5vw,3rem)] leading-[1.05] text-[var(--hz-text)]">
              Every page, in one directory.
            </h1>
          </div>
          <dl className="flex flex-wrap items-end gap-x-10 gap-y-4">
            <div>
              <dt className="text-caption text-[var(--hz-text-subtle)]">Pages</dt>
              <dd className="hz-display mt-1 text-[1.6rem] tabular-nums text-[var(--hz-text)]">{TOTAL}</dd>
            </div>
            <div>
              <dt className="text-caption text-[var(--hz-text-subtle)]">Sections</dt>
              <dd className="hz-display mt-1 text-[1.6rem] tabular-nums text-[var(--hz-text)]">{SECTIONS.length}</dd>
            </div>
            <div>
              <dt className="text-caption text-[var(--hz-text-subtle)]">For crawlers</dt>
              <dd className="mt-1">
                <a
                  href="/sitemap.xml"
                  className="hz-focus font-mono text-small font-semibold text-[var(--hz-cobalt)] underline underline-offset-4"
                >
                  /sitemap.xml
                </a>
              </dd>
            </div>
          </dl>
        </div>
        <p className="mt-8 max-w-[62ch] text-small leading-relaxed text-[var(--hz-text-mute)]">
          Grouped by what you came here to do rather than by how the URLs nest.
        </p>
      </header>

      <section className="w-full px-6 py-14 sm:px-10 sm:py-16 lg:px-16 2xl:px-24">
        <Stagger as="div" className="grid gap-x-12 gap-y-14 lg:grid-cols-2 2xl:grid-cols-3" gap={0.06}>
          {SECTIONS.map((s) => (
            <StaggerItem as="section" key={s.group}>
              <div className="flex items-start gap-4 border-b border-[var(--hz-line)] pb-5">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
                  <s.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h2 className="hz-display text-[1.15rem] leading-tight text-[var(--hz-text)]">
                    {s.group}
                  </h2>
                  <p className="mt-1 text-caption text-[var(--hz-text-subtle)]">{s.note}</p>
                </div>
              </div>

              <ul className="mt-1 divide-y divide-[var(--hz-line)]">
                {s.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="hz-focus group flex items-baseline justify-between gap-4 py-2.5 text-small text-[var(--hz-text-mute)] transition-colors hover:text-[var(--hz-cobalt)]"
                    >
                      <span>{l.name}</span>
                      {/* The path is the reason someone is on this page rather
                          than in the nav, so it is shown, not hidden. */}
                      <span className="hidden font-mono text-fine text-[var(--hz-text-subtle)] transition-colors group-hover:text-[var(--hz-cobalt)] sm:block">
                        {l.href}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </StaggerItem>
          ))}
        </Stagger>

      </section>
    </div>
  );
}
