"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { SOCIAL_LINKS } from "@/components/layout/social";
import { OPEN_COOKIE_SETTINGS } from "@/components/layout/CookieConsent";
import { CONTACT_EMAIL, CONTACT_PHONE, HQ_ADDRESS, LEGAL_NAME } from "@/lib/company";

type FooterLink = [label: string, href: string];

// Five short columns, five links at most (Miller). The rest is one hop away
// through the header menus or the site map.
const FOOTER_COLS: { h: string; l: FooterLink[] }[] = [
  {
    h: "Solutions",
    l: [
      ["IT Staffing & Talent", "/solutions/staffing"],
      ["Engineering Talent", "/solutions/engineering"],
      ["Cloud Engineering", "/solutions/cloud"],
      ["Managed Services", "/solutions/managed"],
      ["Training & Upskilling", "/solutions/training"],
    ],
  },
  {
    h: "Resources",
    l: [
      ["Case studies", "/case-studies"],
      ["Customer stories", "/customer-stories"],
      ["Blog", "/blog"],
      ["News", "/news"],
      ["Developer docs", "/developers"],
    ],
  },
  {
    h: "Company",
    l: [
      ["About us", "/about"],
      ["Our team", "/team"],
      ["Products", "/products"],
      ["FAQ", "/faq"],
      ["Contact us", "/contact"],
    ],
  },
  {
    h: "Careers",
    l: [
      ["Working here", "/careers"],
      ["Open positions", "/careers/search"],
      ["Employee HR portal", "https://hr.oceanbluecorp.com"],
      ["Staff sign in", "/auth/signin"],
    ],
  },
  {
    h: "Legal",
    l: [
      ["Privacy & legal", "/legal"],
      ["Security", "/security"],
      ["Accessibility", "/accessibility"],
      ["Site map", "/sitemap"],
      // Not a route: reopens the consent choices (see CookieConsent).
      ["Cookies", OPEN_COOKIE_SETTINGS],
    ],
  },
];


const LINK = "rounded-sm transition-colors duration-150 hover:text-ink";

function FooterLink({ label, href }: { label: string; href: string }) {
  if (href === OPEN_COOKIE_SETTINGS) {
    return (
      <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))} className={`leading-[inherit] ${LINK}`}>
        {label}
      </button>
    );
  }
  if (/^https?:/.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${LINK}`}>
        {label}
        <ArrowUpRight className="size-3.5 flex-none" aria-hidden="true" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }
  return <Link href={href} className={LINK}>{label}</Link>;
}

const CONTACT_LINK = `block ${LINK}`;

export function SiteFooter() {
  return (
    <footer className="site border-t border-line bg-paper text-ink" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>

      {/* Row 1: the site links, legal, and how to reach us as the last column. */}
      <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-x-6 gap-y-10 px-4 pt-14 pb-12 sm:px-6 md:grid-cols-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_minmax(0,1.3fr)] lg:pt-16">
        {FOOTER_COLS.map((c) => (
          <nav key={c.h} aria-labelledby={`footer-${c.h}`}>
            <h3 id={`footer-${c.h}`} className="type-label text-ink">{c.h}</h3>
            <ul className="mt-4 space-y-3 type-body-sm text-ink-muted">
              {c.l.map(([label, href]) => (
                <li key={label}><FooterLink label={label} href={href} /></li>
              ))}
            </ul>
          </nav>
        ))}
        <div>
          <h3 className="type-label text-ink">Get in touch</h3>
          <address className="mt-4 space-y-3 type-body-sm not-italic text-ink-muted">
            <a href={CONTACT_PHONE.href} className={`${CONTACT_LINK} tabular-nums`}>{CONTACT_PHONE.label}</a>
            <a href={`mailto:${CONTACT_EMAIL}`} className={CONTACT_LINK}>{CONTACT_EMAIL}</a>
            <p className="max-w-[26ch]">{HQ_ADDRESS}</p>
          </address>
        </div>
      </div>

      {/* Row 2: brand and back to top; ownership and social on the line below it. */}
      <div className="border-t border-line">
        <div className="mx-auto max-w-[1240px] px-4 pt-6 pb-5 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" aria-label={`${LEGAL_NAME}, home`} className="inline-flex flex-none rounded-sm">
              <Image src="/logo.webp" alt="" width={225} height={60} className="h-9 w-auto" />
            </Link>
            <a
              href="#top"
              aria-label="Back to top"
              title="Back to top"
              className="flex size-10 items-center justify-center rounded-full border border-line-input bg-white text-ink transition-colors duration-150 hover:border-cobalt hover:bg-cobalt hover:text-white"
            >
              <ArrowUp className="size-[18px]" aria-hidden="true" />
            </a>
          </div>
          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="type-caption text-ink-subtle">© {new Date().getFullYear()} {LEGAL_NAME}</p>
            <ul className="-ml-2.5 flex sm:-mr-2.5 sm:ml-0 items-center gap-1" aria-label="Oceanblue on social media">
              {SOCIAL_LINKS.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.name}
                    className="flex size-10 items-center justify-center rounded-full text-ink-subtle transition-colors duration-150 hover:bg-white hover:text-cobalt"
                  >
                    <s.icon className="size-[18px]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
