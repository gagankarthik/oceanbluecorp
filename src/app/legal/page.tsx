import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Cta } from "@/components/landing/ui";

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

export const metadata: Metadata = {
  title: "Legal and privacy",
  description:
    "Ocean Blue Corporation's legal documents: privacy policy, terms of service, cookie policy, data deletion requests, accessibility statement and security practices.",
  openGraph: {
    title: "Legal and privacy | Ocean Blue Corporation",
    description:
      "Privacy policy, terms of service, cookie policy, data deletion, accessibility and security at Ocean Blue Corporation.",
    url: "https://oceanbluecorp.com/legal",
  },
  alternates: { canonical: "https://oceanbluecorp.com/legal" },
};

const documents = [
  {
    name: "Privacy Policy",
    href: "/privacy",
    updated: "April 1, 2026",
    desc: "What personal data we collect, how it is used, how long it is kept, and the rights available to you, including under CCPA.",
  },
  {
    name: "Terms of Service",
    href: "/terms",
    updated: "April 1, 2026",
    desc: "The agreement governing use of this site and our services: your responsibilities, acceptable use, and limitation of liability.",
  },
  {
    name: "Cookie Policy",
    href: "/cookies",
    updated: "April 1, 2026",
    desc: "Which cookies this site sets, what each one does, and how to control them in your browser.",
  },
  {
    name: "Data Deletion",
    href: "/data-deletion",
    updated: null,
    desc: "How to request deletion of your personal data, what we remove, and what we are required to retain.",
  },
  {
    name: "Accessibility",
    href: "/accessibility",
    updated: "May 23, 2026",
    desc: "Our WCAG 2.1 AA conformance target, what we have implemented, and how to report a barrier you hit.",
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
    <div className="horizon min-h-screen w-full bg-[var(--hz-canvas)]">
      {/* No photograph, on purpose. A full-bleed image hero is the marketing
          treatment, and this is a document index: somebody arrives already
          looking for a named thing, and a picture of an office delays it.
          The page carries its weight in type and a rule instead. */}
      <header className="w-full border-b border-[var(--hz-line)] px-6 pb-12 pt-28 sm:px-10 sm:pb-14 sm:pt-32 lg:px-16 2xl:px-24">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div>
            <p className="hz-eyebrow text-[var(--hz-text-subtle)]">Legal and privacy</p>
            <h1 className="hz-display mt-5 max-w-[16ch] text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.02] text-[var(--hz-text)]">
              The documents, in one place.
            </h1>
          </div>
          <p className="max-w-[44ch] text-[16px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[17px]">
            Everything governing how we handle your data and how this site may
            be used. Each one states when it was last effective.
          </p>
        </div>

        <p className="mt-10 font-mono text-caption text-[var(--hz-text-subtle)]">
          {documents.length} documents
        </p>
      </header>

      <section className="w-full px-6 py-14 sm:px-10 sm:py-16 lg:px-16 2xl:px-24">
        <Stagger
          as="ul"
          className="divide-y divide-[var(--hz-line)] border-b border-[var(--hz-line)]"
          gap={0.06}
        >
          {documents.map((d) => (
            <StaggerItem as="li" key={d.href}>
              <Link
                href={d.href}
                className="hz-focus group grid gap-3 py-7 lg:grid-cols-12 lg:items-baseline lg:gap-10"
              >
                <div className="lg:col-span-4">
                  <h2 className="hz-display text-subhead text-[var(--hz-text)] transition-colors group-hover:text-[var(--hz-cobalt)]">
                    {d.name}
                  </h2>
                  {/* Stated per document rather than site-wide: these are
                      revised independently, and a single date at the bottom of
                      a hub would be wrong for most of them. */}
                  {d.updated && (
                    <p className="mt-2 text-caption text-[var(--hz-text-subtle)]">
                      Effective {d.updated}
                    </p>
                  )}
                </div>
                <p className="max-w-[64ch] text-small leading-relaxed text-[var(--hz-text-mute)] lg:col-span-7">
                  {d.desc}
                </p>
                <span className="lg:col-span-1 lg:justify-self-end">
                  <ArrowRight
                    className="h-5 w-5 text-[var(--hz-text-subtle)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:text-[var(--hz-cobalt)]"
                    strokeWidth={2}
                  />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-14 max-w-2xl border-t border-[var(--hz-line)] pt-10">
          <h2 className="hz-display text-title text-[var(--hz-text)]">
            Questions about any of this?
          </h2>
          <p className="mt-4 max-w-[56ch] text-small leading-relaxed text-[var(--hz-text-mute)]">
            For privacy requests, data deletion, or anything else in these
            documents, email{" "}
            <a
              href="mailto:hr@oceanbluecorp.com"
              className="hz-focus font-semibold text-[var(--hz-cobalt)] underline-offset-4 hover:underline"
            >
              hr@oceanbluecorp.com
            </a>
            .
          </p>
          <div className="mt-8">
            <Cta href="/contact" variant="ghostLight">Contact us</Cta>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
