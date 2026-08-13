"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SOCIAL_LINKS } from "@/components/layout/social";

/* Built to the EY footer: the mark on the left, one wrapping row of underlined
 * links across the top, and a band of small print beneath with the social
 * marks as outlined circles on the right.
 *
 * One row rather than columns is the whole point. This was four columns of
 * six, twenty-three links, which is a directory; a footer is scanned for one
 * of about ten things. Anything not here is on /sitemap, which is in the row.
 *
 * Light on purpose: every page closes on a dark band, and an ink footer
 * stacked onto one read as a single unlit block with a rule through it.
 */

/* One row, everything in it. Two cuts from the eleven that were here:
 * "Our team" and "Security" both sit one click inside pages already in this
 * row (/about and /legal) and in the header's About menu, so they were costing
 * width without adding a destination. What is left is the set somebody
 * actually scans a footer for. Anything else is on /sitemap, which is here. */
const links = [
  { name: "Connect with us", href: "/contact" },
  { name: "Solutions", href: "/solutions" },
  { name: "About us", href: "/about" },
  { name: "Careers", href: "/careers" },
  { name: "Products", href: "/products" },
  { name: "FAQ", href: "/faq" },
  { name: "Site map", href: "/sitemap" },
  { name: "Legal and privacy", href: "/legal" },
  // Kept in the row rather than only inside the legal hub: an accessibility
  // statement is looked for by name, and burying it costs a click at exactly
  // the moment somebody is already having difficulty.
  { name: "Accessibility", href: "/accessibility" },
];

type OverallStatus = "operational" | "degraded" | "outage" | "maintenance" | "unknown";

const STATUS: Record<OverallStatus, { dot: string; label: string }> = {
  operational: { dot: "#16a34a", label: "All systems operational" },
  maintenance: { dot: "#2563eb", label: "Scheduled maintenance" },
  degraded: { dot: "#d97706", label: "Partial degradation" },
  outage: { dot: "#dc2626", label: "Service disruption" },
  unknown: { dot: "#94a3b8", label: "Status" },
};

function FooterStatus() {
  const [status, setStatus] = useState<OverallStatus>("unknown");
  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => { if (d?.overall) setStatus(d.overall as OverallStatus); })
      .catch(() => {});
  }, []);
  const cfg = STATUS[status];
  return (
    <Link
      href="/status"
      className="hz-focus inline-flex items-center gap-2 text-micro text-[var(--hz-text-subtle)] transition-colors hover:text-[var(--hz-text)]"
    >
      <span className="relative flex h-2 w-2">
        {status === "operational" && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none"
            style={{ background: cfg.dot }}
          />
        )}
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: cfg.dot }} />
      </span>
      {cfg.label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="relative w-full border-t border-black/[0.08] bg-[var(--hz-canvas)]">
      {/* Container matches the HEADER exactly, so the footer mark sits directly
          under the nav mark. Do not put this on the landing page's wider
          measure. */}
      <div className="mx-auto w-full max-w-7xl px-6 py-14 sm:px-8 sm:py-16 2xl:max-w-[96rem]">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
          {/* Mark */}
          <div className="flex-none">
            <Link href="/" className="hz-focus inline-block" aria-label="Ocean Blue Corporation, home">
              <Image src="/logo.png" alt="Ocean Blue Corporation" width={340} height={80} className="h-11 w-auto sm:h-12" />
            </Link>
          </div>

          {/* One wrapping row of links, underlined the way the reference sets
              them, so they read as a directory line rather than as body copy. */}
          <nav aria-label="Footer" className="lg:ml-auto">
            <ul className="flex flex-wrap gap-x-6 gap-y-3 lg:justify-end">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="hz-focus text-small font-semibold text-[var(--hz-text)] underline decoration-[var(--hz-text)] decoration-1 underline-offset-[5px] transition-colors hover:text-[var(--hz-cobalt)] hover:decoration-[var(--hz-cobalt)]"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Small print, with the social marks opposite. */}
        <div className="mt-12 flex flex-col gap-8 sm:mt-14 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-micro text-[var(--hz-text-subtle)]">
              © {new Date().getFullYear()} Ocean Blue Corporation. All rights reserved.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            <FooterStatus />
          </div>

          {/* Outlined circles, as in the reference. */}
          <div className="flex items-center gap-2.5">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="hz-focus grid h-10 w-10 place-items-center rounded-full text-[var(--hz-text)] ring-1 ring-[var(--hz-line-2)] transition-all duration-300 hover:bg-[var(--hz-text)] hover:text-white hover:ring-[var(--hz-text)]"
              >
                <s.icon className="h-[17px] w-[17px]" strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
