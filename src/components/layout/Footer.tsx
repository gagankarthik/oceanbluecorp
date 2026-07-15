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
  Developers: [
    { name: "Job Feed API", href: "/developers" },
    { name: "API Docs", href: "/developers#endpoints" },
    { name: "Authentication", href: "/developers#authentication" },
    { name: "Quickstart", href: "/developers#quickstart" },
    { name: "Brand Kit", href: "/brand-kit" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Data Deletion", href: "/data-deletion" },
    { name: "Accessibility", href: "/accessibility" },
    { name: "Sitemap", href: "/sitemap" },
    { name: "System Status", href: "/status" },
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
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          {/* Brand + contact */}
          <div>
            <Link href="/" className="inline-block">
              <Image src="/logo.png" alt="Ocean Blue Corporation" width={170} height={40} className="h-8 w-auto" />
            </Link>
            <p className="mt-6 max-w-xs text-[14px] leading-relaxed text-[var(--hz-text-mute)]">
              IT staffing, enterprise solutions, and managed services — one
              accountable partner for enterprises and government agencies.
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

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading}>
                <h3 className="hz-eyebrow text-[var(--hz-text-subtle)]">{heading}</h3>
                <ul className="mt-5 space-y-3">
                  {links.map((l) => (
                    <li key={l.name}>
                      <Link href={l.href} className="text-[14px] text-[var(--hz-text-mute)] transition-colors hover:text-[var(--hz-cobalt)]">
                        {l.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-black/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row lg:px-8">
          <p className="text-[13px] text-[var(--hz-text-subtle)]">
            © {new Date().getFullYear()} Ocean Blue Corporation. All rights reserved.
          </p>
          <FooterStatus />
          <div className="flex items-center gap-2">
            {socialLinks.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="grid h-9 w-9 place-items-center rounded-full text-[var(--hz-text-mute)] transition-all duration-300 hover:bg-[var(--hz-cobalt-100)] hover:text-[var(--hz-cobalt)]"
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
