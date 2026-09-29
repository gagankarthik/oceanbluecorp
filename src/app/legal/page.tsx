import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { CONTAINER, OPENER_Y, SECTION_Y } from "@/components/site/sections";
import { LinkButton } from "@/components/site/button";
import { IconArrowRight, IconLock, IconCaseStudy, IconShieldLock, IconMail, type Icon } from "@/components/site/icons";
import { IconCookie, IconTrash, IconAccess } from "@/components/site/legal/doc";

/**
 * Legal and privacy index.
 *
 * The footer used to carry six separate legal links, which crowded the
 * navigation people actually follow. They live behind this one entry now, and
 * this page is the directory: every document, what it covers, and when it was
 * last effective, so somebody can tell at a glance whether they are reading a
 * current version.
 *
 * The documents themselves did not move. Their URLs are unchanged, which
 * matters because legal pages get bookmarked, cited in contracts and linked
 * from consent banners.
 */

export const metadata: Metadata = pageMetadata({
  path: "/legal",
  title: "Legal & Privacy",
  description: "Ocean Blue Corporation's legal documents: privacy policy, terms of service, cookie policy, data deletion, accessibility statement and security practices.",
});

const documents: { name: string; href: string; updated: string | null; desc: string; icon: Icon }[] = [
  {
    name: "Privacy Policy",
    href: "/privacy",
    updated: "April 1, 2026",
    desc: "What personal data we collect, how it is used, how long it is kept, and the rights available to you, including under CCPA.",
    icon: IconLock,
  },
  {
    name: "Terms of Service",
    href: "/terms",
    updated: "April 1, 2026",
    desc: "The agreement governing use of this site and our services: your responsibilities, acceptable use, and limitation of liability.",
    icon: IconCaseStudy,
  },
  {
    name: "Cookie Policy",
    href: "/cookies",
    updated: "April 1, 2026",
    desc: "Which cookies this site sets, what each one does, and how to control them in your browser.",
    icon: IconCookie,
  },
  {
    name: "Data Deletion",
    href: "/data-deletion",
    updated: null,
    desc: "How to request deletion of your personal data, what we remove, and what we are required to retain.",
    icon: IconTrash,
  },
  {
    name: "Accessibility",
    href: "/accessibility",
    updated: "May 23, 2026",
    desc: "Our WCAG 2.1 AA conformance target, what we have implemented, and how to report a barrier you hit.",
    icon: IconAccess,
  },
  {
    name: "Security",
    href: "/security",
    updated: null,
    desc: "Encryption, access controls, where data is stored and who can reach it, and how to report a vulnerability.",
    icon: IconShieldLock,
  },
];

export default function Legal() {
  return (
    <>
      {/* No photograph, on purpose: this is a document index. Somebody arrives
          already looking for a named thing, so type and a rule carry it. */}
      <header data-opener className="border-b border-line bg-white">
        <div className={`${CONTAINER} ${OPENER_Y} grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end lg:gap-16`}>
          <div>
            <p className="rise type-label font-semibold text-cobalt">Legal and privacy</p>
            <h1 className="rise mt-3 max-w-[16ch] type-headline-lg font-semibold text-ink" style={{ animationDelay: "80ms" }}>
              The documents, in one place.
            </h1>
          </div>
          <div className="rise" style={{ animationDelay: "180ms" }}>
            <p className="max-w-[46ch] type-body-lg text-ink-muted">
              Everything governing how we handle your data and how this site may
              be used. Each one states when it was last effective.
            </p>
            <p className="mt-5 font-mono text-[13px] text-ink-subtle">{documents.length} documents</p>
          </div>
        </div>
      </header>

      <section data-tone="paper" className={`bg-paper ${SECTION_Y}`}>
        <div className={CONTAINER}>
          {/* Hairline grid: one cell per document, revised independently, so
              each carries its own effective date. */}
          <ul className="reveal grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((d) => (
              <li key={d.href} className="bg-white">
                <Link href={d.href} className="group flex h-full min-h-[240px] flex-col p-7 transition-colors hover:bg-paper sm:p-8">
                  <span className="flex size-11 items-center justify-center rounded-xl border border-line bg-white text-ink transition-colors group-hover:border-cobalt group-hover:bg-cobalt group-hover:text-white">
                    <d.icon size={20} />
                  </span>
                  <h2 className="mt-6 type-title-lg font-semibold text-ink">{d.name}</h2>
                  {d.updated && <p className="mt-1 type-body-sm text-ink-subtle">Effective {d.updated}</p>}
                  <p className="mt-3 type-body text-ink-muted">{d.desc}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-6 type-label font-semibold text-ink">
                    Read
                    <IconArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section data-tone="white" className={`bg-white ${SECTION_Y}`}>
        <div className={`${CONTAINER} reveal grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16`}>
          <div>
            <h2 className="type-headline-sm font-semibold text-ink">
              Questions about any of this?
            </h2>
            <p className="mt-3 max-w-[56ch] type-body text-ink-muted">
              For privacy requests, data deletion, or anything else in these
              documents, email{" "}
              <a href="mailto:hr@oceanbluecorp.com" className="font-semibold text-cobalt underline underline-offset-4">
                hr@oceanbluecorp.com
              </a>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="mailto:hr@oceanbluecorp.com" variant="outline" size="lg">
              <IconMail size={16} /> Email us
            </LinkButton>
            <LinkButton href="/contact" variant="primary" size="lg">
              Contact us
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
