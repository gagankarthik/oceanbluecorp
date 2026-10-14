import Link from "next/link";
import { company, services } from "@/lib/site-content";
import Logo from "./Logo";
import CookieSettingsButton from "./CookieSettingsButton";

const columns = [
  {
    title: "Services",
    links: services.map((s) => ({ href: `/services/${s.slug}`, label: s.name })),
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/how-we-work", label: "How we work" },
      { href: "/industries", label: "Industries" },
      { href: "/certifications", label: "Certifications" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/resources/customer-stories", label: "Customer stories" },
      { href: "/resources/case-studies", label: "Case studies" },
      { href: "/resources/blog", label: "Blog" },
      { href: "/resources/news", label: "News" },
      { href: "/resources/media-kit", label: "Media kit" },
      { href: "/products", label: "Our products" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Use" },
      { href: "/cookies", label: "Cookie Policy" },
      { href: "/accessibility", label: "Accessibility" },
      { href: "/security", label: "Security" },
      { href: "/legal", label: "All legal documents" },
    ],
  },
];

// Smaller lists stacked under a column
const careers = [
  { href: "/jobs", label: "Find a job" },
  { href: "/careers", label: "Working at Oceanblue" },
  { href: `mailto:${company.email}?subject=Resume`, label: "Send your resume" },
];

const more = [
  { href: "/developers", label: "Developers" },
  { href: "/status", label: "System status" },
  { href: "/sitemap", label: "Site map" },
];

const socials = [
  {
    name: "LinkedIn",
    href: company.social.linkedin,
    path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.5h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4v-11Z",
  },
  {
    name: "X",
    href: company.social.x,
    path: "M17.75 3h3.07l-6.71 7.67L22 21h-6.18l-4.84-6.33L5.44 21H2.37l7.18-8.2L2 3h6.34l4.37 5.78L17.75 3Zm-1.08 16.18h1.7L7.4 4.73H5.58l11.09 14.45Z",
  },
  {
    name: "YouTube",
    href: company.social.youtube,
    path: "M23 7.2a3 3 0 0 0-2.1-2.12C19.03 4.6 12 4.6 12 4.6s-7.03 0-8.9.48A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.12c1.87.48 8.9.48 8.9.48s7.03 0 8.9-.48A3 3 0 0 0 23 16.8a31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z",
  },
  {
    name: "Instagram",
    href: company.social.instagram,
    path: "M12 2.2c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16Zm0 4.86a4.94 4.94 0 1 0 0 9.88 4.94 4.94 0 0 0 0-9.88Zm0 8.15a3.21 3.21 0 1 1 0-6.42 3.21 3.21 0 0 1 0 6.42Zm5.13-9.5a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3Z",
  },
];

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-mist-50">
      <div className="gutter grid gap-14 pb-14 pt-20 lg:grid-cols-12">
        {/* Company and contact */}
        <div className="flex flex-col lg:col-span-4 lg:-mb-14">
          <Link href="/" aria-label="Oceanblue Solutions home" className="inline-block">
            <Logo variant="white" className="h-11 w-[9.4rem]" />
          </Link>
          <p className="mt-5 max-w-[36ch] text-tide-300">{company.position}</p>

          <dl className="mt-8 grid gap-4 text-[15px]">
            <div>
              <dt className="text-tide-300">Call us</dt>
              <dd>
                <a href={company.tel} className="font-medium text-white hover:text-cyan-300">
                  {company.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-tide-300">Email</dt>
              <dd>
                <a href={`mailto:${company.email}`} className="font-medium text-white hover:text-cyan-300">
                  {company.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-tide-300">Headquarters</dt>
              <dd className="text-white">
                {company.address[0]}, {company.address[1]}
              </dd>
            </div>
          </dl>

          {/* Centred in the space between the address and the bottom bar */}
          <div className="mt-8 flex flex-1 items-center lg:my-8">
            <ul aria-label="Social media" className="flex gap-2">
              {socials.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Oceanblue on ${s.name}`}
                    className="grid size-11 place-items-center bg-navy-800 text-tide-300 transition-colors hover:bg-cyan-500 hover:text-navy-950"
                  >
                    <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]" fill="currentColor">
                      <path d={s.path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-10 text-[15px] sm:grid-cols-4 lg:col-span-8 lg:col-start-5">
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="font-semibold text-white">{col.title}</p>
              <ul className="mt-5 space-y-3 text-tide-300">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    {l.href.startsWith("mailto:") ? (
                      <a href={l.href} className="transition-colors hover:text-white">
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              {col.title === "Company" && (
                <div className="mt-10">
                  <p className="font-semibold text-white">Careers</p>
                  <ul className="mt-5 space-y-3 text-tide-300">
                    {careers.map((l) => (
                      <li key={l.label}>
                        {l.href.startsWith("mailto:") ? (
                          <a href={l.href} className="transition-colors hover:text-white">
                            {l.label}
                          </a>
                        ) : (
                          <Link href={l.href} className="transition-colors hover:text-white">
                            {l.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {col.title === "Resources" && (
                <div className="mt-10">
                  <p className="font-semibold text-white">More</p>
                  <ul className="mt-5 space-y-3 text-tide-300">
                    {more.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} className="transition-colors hover:text-white">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <CookieSettingsButton className="text-left transition-colors hover:text-white" />
                    </li>
                  </ul>
                </div>
              )}
            </nav>
          ))}
        </div>
      </div>

      <div data-footer-bar className="gutter bg-black/25">
        <div className="flex flex-col gap-4 py-6 text-[length:var(--text-small)] text-tide-300 lg:flex-row lg:items-center lg:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {company.name} All rights reserved.
          </p>
          <div>
            <ul aria-label="Staff sign in" className="flex flex-wrap gap-2">
              {[
                { href: company.portals.hr, label: "HR portal" },
                { href: company.portals.staff, label: "Employee sign in" },
              ].map((p) => (
                <li key={p.label}>
                  <a
                    href={p.href}
                    className="inline-flex min-h-10 items-center gap-2 bg-navy-800 px-4 font-medium text-white transition-colors hover:bg-navy-700"
                  >
                    <svg aria-hidden viewBox="0 0 16 16" className="size-4 text-cyan-300" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="7" width="10" height="7" rx="1.2" />
                      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
                    </svg>
                    {p.label}
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
