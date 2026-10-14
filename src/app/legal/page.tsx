import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { LEGAL_DOCS } from "@/lib/legal";
import { company } from "@/lib/site-content";
import { Arrow } from "@/components/site/legal/doc";

/* The directory of legal documents. Their URLs never move: they get
   bookmarked, cited in contracts and linked from the consent banner. */

export const metadata: Metadata = pageMetadata({
  path: "/legal",
  title: "Legal & Privacy",
  description: "Oceanblue Solutions, Inc.'s legal documents: privacy policy, terms of use, cookie policy, data deletion, accessibility statement and security practices.",
});

// Dates as each document states them (LegalPage pages carry theirs inline)
const LEGALPAGE_UPDATED = "October 14, 2026";

const documents: { name: string; href: string; updated: string | null; desc: string }[] = [
  {
    name: "Privacy Policy",
    href: "/privacy",
    updated: LEGALPAGE_UPDATED,
    desc: "What personal information we collect through this site, how it is used, and the choices you have.",
  },
  {
    name: "Terms of Use",
    href: "/terms",
    updated: LEGALPAGE_UPDATED,
    desc: "The terms governing use of this website.",
  },
  {
    name: "Cookie Policy",
    href: "/cookies",
    updated: LEGAL_DOCS.cookies.updated,
    desc: "What this site stores on your device, what each item does, and how to change your choice.",
  },
  {
    name: "Data deletion",
    href: "/data-deletion",
    updated: null,
    desc: "How to request deletion of your personal data, what we remove, and what we are required to retain.",
  },
  {
    name: "Accessibility",
    href: "/accessibility",
    updated: LEGALPAGE_UPDATED,
    desc: "Our WCAG 2.1 AA target, what we have done, and how to report a barrier you hit.",
  },
  {
    name: "Equal Opportunity",
    href: "/equal-opportunity",
    updated: LEGALPAGE_UPDATED,
    desc: "Our equal employment opportunity statement.",
  },
  {
    name: "Security",
    href: "/security",
    updated: null,
    desc: "Encryption, access controls, where data is stored and who can reach it, and how to report a vulnerability.",
  },
];

export default function Legal() {
  return (
    <>
      <header id="top" className="bg-field-paper">
        <div className="gutter grid gap-8 pb-12 pt-14 md:pb-16 md:pt-20 lg:grid-cols-12">
          <p className="side text-mist-600 lg:pt-4">Legal and privacy</p>
          <h1 className="lines poster axis text-[clamp(2.75rem,6vw,5.5rem)]">
            <span className="line">
              <span data-line style={{ "--i": 0 } as React.CSSProperties}>
                The documents,
              </span>
            </span>
            <span className="line">
              <span data-line style={{ "--i": 1 } as React.CSSProperties}>
                in one place.
              </span>
            </span>
          </h1>
          <p data-after-lines className="axis max-w-[46ch] text-lead leading-snug">
            Everything governing how we handle your data and how this site may be used. Each one states when it was last updated.
          </p>
        </div>
      </header>

      <section aria-label="Documents" className="bg-field-mist">
        <ul className="gutter grid gap-2 py-16 sm:grid-cols-2 md:py-20 lg:grid-cols-3">
          {documents.map((d, i) => (
            <li key={d.href} data-reveal style={{ "--d": i % 3 } as React.CSSProperties}>
              <Link href={d.href} className="group flex h-full min-h-[220px] flex-col bg-mist-0 p-7 transition-colors hover:bg-tide-100">
                <h2 className="display text-[clamp(1.5rem,2vw,2rem)] group-hover:text-ocean-700">{d.name}</h2>
                {d.updated && <p className="mt-1 text-[15px] text-mist-600">Last updated {d.updated}</p>}
                <p className="mt-4 leading-relaxed">{d.desc}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-6 font-medium text-ocean-700">
                  Read
                  <Arrow className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="legal-q" className="bg-field-paper">
        <div className="gutter grid items-end gap-8 py-16 md:py-20 lg:grid-cols-12">
          <div className="lg:col-span-7" data-reveal>
            <h2 id="legal-q" className="display text-[clamp(2rem,3.4vw,3.25rem)]">
              Questions about any of this?
            </h2>
            <p className="mt-4 max-w-[56ch] text-mist-600">
              For privacy requests, data deletion, or anything else in these documents, email{" "}
              <a href={`mailto:${company.email}`} className="text-ocean-700 underline underline-offset-4">
                {company.email}
              </a>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:col-span-4 lg:col-start-9 lg:justify-end" data-reveal>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center bg-ocean-600 px-6 font-medium text-white transition-colors hover:bg-ocean-700 active:scale-[0.98]"
            >
              Contact us
            </Link>
            <a
              href={`mailto:${company.email}`}
              className="inline-flex min-h-12 items-center px-6 font-medium text-navy-900 ring-2 ring-inset ring-navy-900 transition-colors hover:bg-navy-900 hover:text-white"
            >
              Email us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
