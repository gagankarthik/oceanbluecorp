"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type SVGProps } from "react";
import { Mail, Phone, MapPin, Linkedin, Youtube, Instagram } from "lucide-react";

// Official X (formerly Twitter) brand mark — lucide's `X` is the close/cross icon.
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
    <Link href="/status" className="group inline-flex items-center gap-2 text-[13px] text-white/55 transition-colors hover:text-white">
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
        /* Dark footer, matching the reference. The page already ends dark — proof
       band, careers band — so a light footer under them read as the document
       stopping and a different one starting. Dark here lets the whole lower
       third settle as one close. */
    <footer className="relative w-full bg-[var(--hz-ink)]">
      {/* px-6 sm:px-8 matches the header and every page section, so the logo
          lines up with the content above it. It was px-6 lg:px-8, which put
          the footer on a different gutter at sm/md widths. */}
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_2.2fr] lg:gap-16">
          {/* Brand + contact */}
          <div>
            <Link href="/" className="inline-block">
              <Image src="/logo.png" alt="Ocean Blue Corporation" width={170} height={40} className="h-8 w-auto" />
            </Link>
            <p className="mt-6 max-w-xs text-[14px] leading-relaxed text-white/55">
              IT staffing, enterprise solutions, and managed services. One
              accountable partner for enterprises and government agencies.
            </p>
            <div className="mt-8 space-y-3 text-[14px]">
              <a href="mailto:hr@oceanbluecorp.com" className="flex items-center gap-3 text-white/65 transition-colors hover:text-white">
                <Mail className="h-4 w-4 text-[var(--hz-aqua)]" strokeWidth={1.5} />
                hr@oceanbluecorp.com
              </a>
              <a href="tel:+16148446925" className="flex items-center gap-3 text-white/65 transition-colors hover:text-white">
                <Phone className="h-4 w-4 text-[var(--hz-aqua)]" strokeWidth={1.5} />
                +1 (614) 844-6925
              </a>
              <p className="flex items-start gap-3 text-white/45">
                <MapPin className="mt-0.5 h-4 w-4 flex-none text-[var(--hz-aqua)]" strokeWidth={1.5} />
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
                <h3 className="hz-eyebrow text-white/40">{heading}</h3>
                <ul className="mt-5 space-y-3">
                  {links.map((l) => (
                    <li key={l.name}>
                      {"external" in l && l.external ? (
                        <a
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-[14px] leading-snug text-white/65 transition-colors hover:text-white"
                        >
                          {l.name}
                        </a>
                      ) : (
                        <Link
                          href={l.href}
                          className="inline-block text-[14px] leading-snug text-white/65 transition-colors hover:text-white"
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

      {/* Bottom bar: copyright left, system status dead centre, social right —
          three fixed zones, so the status pill anchors the middle of the row. */}
      <div className="border-t border-white/[0.10]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-5 px-6 py-6 sm:grid-cols-3 sm:px-8">
          <p className="text-center text-[13px] text-white/40 sm:text-left">
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
                className="grid h-10 w-10 place-items-center rounded-full text-white/55 transition-all duration-300 hover:bg-white/10 hover:text-white"
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
