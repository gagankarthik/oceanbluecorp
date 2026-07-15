import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Sitemap",
  description: "A directory of every page on the Ocean Blue Corporation website — services, careers, products, and more.",
  alternates: { canonical: "https://oceanbluecorp.com/sitemap" },
};

const SECTIONS: { group: string; links: { name: string; href: string }[] }[] = [
  {
    group: "Company",
    links: [
      { name: "Home", href: "/" },
      { name: "About Us", href: "/about" },
      { name: "Our Team", href: "/team" },
      { name: "Products", href: "/products" },
      { name: "Contact", href: "/contact" },
    ],
  },
  {
    group: "Solutions",
    links: [
      { name: "All Solutions", href: "/solutions" },
      { name: "IT Staffing & Talent", href: "/solutions/staffing" },
      { name: "Engineering Talent & Services", href: "/solutions/engineering" },
      { name: "Cloud Engineering", href: "/solutions/cloud" },
      { name: "Cybersecurity", href: "/solutions/cybersecurity" },
      { name: "ERP Solutions", href: "/solutions/erp" },
      { name: "Salesforce Services", href: "/solutions/salesforce" },
      { name: "AI & Data Intelligence", href: "/solutions/ai" },
      { name: "Managed Services", href: "/solutions/managed" },
      { name: "Digital Transformation", href: "/solutions/transformation" },
    ],
  },
  {
    group: "Careers",
    links: [
      { name: "Careers", href: "/careers" },
      { name: "Open Positions", href: "/careers/search" },
    ],
  },
  {
    group: "Developers",
    links: [
      { name: "Developers & API", href: "/developers" },
      { name: "Brand Kit", href: "/brand-kit" },
      { name: "System Status", href: "/status" },
    ],
  },
  {
    group: "Legal",
    links: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "Data Deletion", href: "/data-deletion" },
      { name: "Accessibility", href: "/accessibility" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="horizon min-h-screen bg-[var(--hz-canvas)]">
      {/* Hero */}
      <section className="relative isolate w-full overflow-hidden" style={{ background: "#07142b" }}>
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 85% at 82% 0%, rgba(29,78,216,0.32), transparent 62%)" }} />
        <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-14 pt-32 sm:px-8">
          <Link href="/" className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to Home
          </Link>
          <h1 className="hz-display text-[2.25rem] text-white sm:text-[3rem]">Sitemap</h1>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-white/75">
            Every page on oceanbluecorp.com, organized in one place. Looking for the machine-readable version?{" "}
            <a href="/sitemap.xml" className="font-medium text-[var(--hz-cyan-400)] underline underline-offset-2">sitemap.xml</a>.
          </p>
        </div>
      </section>

      {/* Directory */}
      <div className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
        <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <div key={s.group}>
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--hz-text-subtle)]">{s.group}</h2>
              <ul className="space-y-1.5">
                {s.links.map((l) => (
                  <li key={l.name + l.href}>
                    <Link
                      href={l.href}
                      className="inline-flex items-center text-[14.5px] text-[var(--hz-text-mute)] transition-colors hover:text-[var(--hz-cobalt)]"
                    >
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
  );
}
