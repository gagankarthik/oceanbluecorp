"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type SVGProps } from "react";
import { Mail, Phone, MapPin, Linkedin, Youtube, Instagram } from "lucide-react";

// Official X (formerly Twitter) brand mark, lucide's `X` is the close/cross icon.
function XLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const footerLinks = {
  Solutions: [
    { name: "IT Staffing & Talent", href: "/solutions/staffing" },
    { name: "Engineering Talent", href: "/solutions/engineering" },
    { name: "Cloud Engineering", href: "/solutions/cloud" },
    { name: "Managed Services", href: "/solutions/managed" },
    { name: "AI & Data Intelligence", href: "/solutions/ai" },
    { name: "Salesforce Services", href: "/solutions/salesforce" },
  ],
  Company: [
    { name: "About Us", href: "/about" },
    { name: "Our Team", href: "/team" },
    { name: "Careers", href: "/careers" },
    { name: "Open Positions", href: "/careers/search" },
    { name: "Contact", href: "/contact" },
  ],
  // Was a "Developers" column of five entries, four of which were anchors into
  // the same page (/developers, #endpoints, #authentication, #quickstart).
  // A staffing firm's footer does not need four links to one API doc.
  Resources: [
    { name: "Products", href: "/products" },
    { name: "Job Feed API", href: "/developers" },
    { name: "HR Portal", href: "https://hr.oceanbluecorp.com", external: true },
    { name: "Brand Kit", href: "/brand-kit" },
    { name: "System Status", href: "/status" },
    { name: "Sitemap", href: "/sitemap" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Data Deletion", href: "/data-deletion" },
    { name: "Accessibility", href: "/accessibility" },
  ],
};

const socialLinks = [
  { name: "LinkedIn", href: "https://www.linkedin.com/company/ocean-blue-solutions-inc/", icon: Linkedin },
  { name: "X", href: "https://x.com/OceanBlueSol", icon: XLogo },
  { name: "YouTube", href: "https://www.youtube.com/@OceanBlueSolutions", icon: Youtube },
  { name: "Instagram", href: "https://www.instagram.com/oceanbluesolutions", icon: Instagram },
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
    <Link href="/status" className="group inline-flex items-center gap-2 text-[13px] text-[var(--hz-text-mute)] transition-colors hover:text-[var(--hz-text)]">
      <span className="relative flex h-2 w-2">
        {status === "operational" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: cfg.dot }} />
        )}
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: cfg.dot }} />
      </span>
      {cfg.label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="relative w-full border-t border-black/[0.08] bg-[var(--hz-surface)]">
      {/* Container matches the HEADER exactly, max-w-7xl, px-6 sm:px-8, and
          the same 2xl cap, so the footer logo sits directly under the nav
          logo and the last column ends level with the Contact button. It had
          been on the landing page's much wider max-w-[2200px] measure, which
          pushed both edges outboard of the bar above and made the whole page
          look like two different documents stacked. It was px-6 lg:px-8, which put
          the footer on a different gutter at sm/md widths. */}
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 2xl:max-w-[96rem] py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_2.2fr] lg:gap-16">
          {/* Brand + contact */}
          <div>
            <Link href="/" className="inline-block">
              <Image src="/logo.png" alt="Ocean Blue Corporation" width={170} height={40} className="h-8 w-auto" />
            </Link>
            <p className="mt-6 max-w-xs text-[14px] leading-relaxed text-[var(--hz-text-mute)]">
              Talent, engineering, platforms and operations for enterprises and
              government agencies. One team, one contract, one number to call.
            </p>
            <div className="mt-8 space-y-3 text-[14px]">
              <a href="mailto:hr@oceanbluecorp.com" className="flex items-center gap-3 text-[var(--hz-text-mute)] transition-colors hover:text-[var(--hz-cobalt)]">
                <Mail className="h-4 w-4 text-[var(--hz-cobalt)]" strokeWidth={1.5} />
                hr@oceanbluecorp.com
              </a>
              <a href="tel:+16148446925" className="flex items-center gap-3 text-[var(--hz-text-mute)] transition-colors hover:text-[var(--hz-cobalt)]">
                <Phone className="h-4 w-4 text-[var(--hz-cobalt)]" strokeWidth={1.5} />
                +1 (614) 844-6925
              </a>
              <p className="flex items-start gap-3 text-[var(--hz-text-subtle)]">
                <MapPin className="mt-0.5 h-4 w-4 flex-none text-[var(--hz-cobalt)]" strokeWidth={1.5} />
                9775 Fairway Drive, Suite C<br />Powell, OH 43065
              </p>
            </div>
          </div>

          {/* Link columns, 4-up only from md. At sm they were four ~140px
              columns, which wrapped headings like "Resources" onto two lines
              and left the lists visibly ragged. */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-8 md:grid-cols-4">
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading} className="min-w-0">
                <h3 className="hz-eyebrow text-[var(--hz-text-subtle)]">{heading}</h3>
                <ul className="mt-5 space-y-3">
                  {links.map((l) => (
                    <li key={l.name}>
                      {"external" in l && l.external ? (
                        <a
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-[14px] leading-snug text-[var(--hz-text-mute)] transition-colors hover:text-[var(--hz-cobalt)]"
                        >
                          {l.name}
                        </a>
                      ) : (
                        <Link
                          href={l.href}
                          className="inline-block text-[14px] leading-snug text-[var(--hz-text-mute)] transition-colors hover:text-[var(--hz-cobalt)]"
                        >
                          {l.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar: copyright left, system status dead centre, social right, three fixed zones, so the status pill anchors the middle of the row. */}
      <div className="border-t border-black/[0.07]">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 2xl:max-w-[96rem] grid grid-cols-1 items-center gap-5 py-8 sm:grid-cols-3">
          <p className="text-center text-[13px] text-[var(--hz-text-subtle)] sm:text-left">
            © {new Date().getFullYear()} Ocean Blue Corporation. All rights reserved.
          </p>

          <div className="flex justify-center">
            <FooterStatus />
          </div>

          <div className="flex items-center justify-center gap-1 sm:justify-end">
            {socialLinks.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="grid h-10 w-10 place-items-center rounded-full text-[var(--hz-text-mute)] transition-all duration-300 hover:bg-[var(--hz-cobalt-100)] hover:text-[var(--hz-cobalt)]"
              >
                <s.icon className="h-4 w-4" strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
