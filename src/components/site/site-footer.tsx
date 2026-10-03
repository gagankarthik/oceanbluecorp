"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SOCIAL_LINKS } from "@/components/layout/social";
import { OPEN_COOKIE_SETTINGS } from "@/components/layout/CookieConsent";

const FOOTER_COLS: { h: string; l: [string, string][] }[] = [
  {
    h: "Solutions",
    l: [
      ["IT Staffing & Talent", "/solutions/staffing"],
      ["Engineering Talent", "/solutions/engineering"],
      ["Cloud Engineering", "/solutions/cloud"],
      ["Managed Services", "/solutions/managed"],
      ["Training & Upskilling", "/solutions/training"],
      ["All solutions", "/solutions"],
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
      ["Media kit", "/brand-kit"],
    ],
  },
  {
    h: "Company",
    l: [
      ["HR platform", "https://hr.oceanbluecorp.com"],
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
    ],
  },
  {
    h: "Legal",
    l: [
      ["Legal and privacy", "/legal"],
      ["Security", "/security"],
      ["Accessibility", "/accessibility"],
      ["Site map", "/sitemap"],
      // Not a route: reopens the consent choices (see CookieConsent).
      ["Cookie settings", OPEN_COOKIE_SETTINGS],
    ],
  },
];

type Overall =
  "operational" | "degraded" | "outage" | "maintenance" | "unknown";
const STATUS: Record<Overall, { dot: string; label: string }> = {
  operational: { dot: "bg-success", label: "All systems operational" },
  maintenance: { dot: "bg-brand", label: "Scheduled maintenance" },
  degraded: { dot: "bg-warning", label: "Partial degradation" },
  outage: { dot: "bg-danger", label: "Service disruption" },
  unknown: { dot: "bg-line-strong", label: "System status" },
};

function FooterStatus() {
  const [status, setStatus] = useState<Overall>("unknown");
  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => d?.overall && setStatus(d.overall as Overall))
      .catch(() => {});
  }, []);
  const cfg = STATUS[status];
  return (
    <Link
      href="/status"
      className="inline-flex items-center gap-2 text-[13px] text-ink-subtle hover:text-ink"
    >
      <span className={`size-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="site bg-paper text-ink" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-x-6 gap-y-10 px-4 pt-16 pb-12 sm:px-6 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))] lg:gap-10">
        <div className="col-span-2 lg:col-span-1">
          <Link
            href="/"
            aria-label="Ocean Blue Corporation, home"
            className="inline-flex"
          >
            <Image
              src="/logo.webp"
              alt="Ocean Blue Corporation"
              width={225}
              height={60}
              className="h-12 w-auto"
            />
          </Link>
          <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-ink-muted">
            IT staffing, engineering, enterprise solutions, managed services and
            training. Headquartered in Powell, Ohio.
          </p>
          <ul className="mt-6 flex gap-2">
            {SOCIAL_LINKS.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="flex size-11 items-center justify-center rounded-full border border-line-strong bg-white text-ink-muted transition-colors hover:border-ink hover:text-ink"
                >
                  <s.icon className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        {FOOTER_COLS.map((c) => (
          <nav key={c.h} aria-label={c.h}>
            <p className="text-[14px] font-semibold text-ink">{c.h}</p>
            <ul className="mt-4 space-y-3">
              {c.l.map(([label, href]) => (
                <li key={label}>
                  {href === OPEN_COOKIE_SETTINGS ? (
                    <button
                      type="button"
                      onClick={() =>
                        window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))
                      }
                      className="text-left text-[14px] text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                    >
                      {label}
                    </button>
                  ) : (
                    <Link
                      href={href}
                      {...(/^https?:/.test(href)
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="text-[14px] text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                    >
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto grid max-w-[1240px] gap-3 px-4 py-6 text-center sm:px-6 lg:grid-cols-3 lg:items-center lg:text-left">
          <p className="text-[13px] text-ink-subtle">
            © {new Date().getFullYear()} Ocean Blue Corporation. All rights
            reserved.
          </p>
          <div className="lg:text-center">
            <FooterStatus />
          </div>
          <div className="lg:text-right">
            <Link
              href="/auth/signin"
              className="text-[13px] text-ink-subtle underline-offset-4 hover:text-ink hover:underline"
            >
              Staff sign in
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
