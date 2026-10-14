"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { company, industries, servicesByLayer } from "@/lib/site-content";
import Logo from "./Logo";
import AccountMenu, { MobileAccount } from "./AccountMenu";
import { useStaffSession } from "./use-staff-session";

type Item = { href: string; label: string; desc?: string };
type Group = { title: string; href?: string; items: Item[] };
type Menu = {
  id: string;
  label: string;
  /** Paths that mark this menu as the current section */
  match: string[];
  groups: Group[];
  /** Names only, no descriptions: for menus with many items */
  compact?: boolean;
  feature: { title: string; body: string; cta: Item; secondary?: Item };
};

// A layer with a single service lists what that service covers, as on the home page
const toItems = (layer: "people" | "platforms" | "operations") => {
  const list = servicesByLayer(layer);
  return list.length === 1
    ? list[0].includes.map((x) => ({ href: `/services/${list[0].slug}`, label: x.title, desc: x.body }))
    : list.map((s) => ({ href: `/services/${s.slug}`, label: s.name, desc: s.tagline }));
};

const menus: Menu[] = [
  {
    id: "services",
    label: "Services",
    match: ["/services"],
    compact: true,
    groups: [
      { title: "Talent and staffing", href: "/services#people", items: toItems("people") },
      { title: "Technology services", href: "/services#platforms", items: toItems("platforms") },
      { title: "Managed services", href: "/services#operations", items: toItems("operations") },
    ],
    feature: {
      title: "Not sure which service you need?",
      body: "Most work spans more than one. Tell us the problem and we will put the right people on it.",
      cta: { href: "/contact", label: "Talk to us" },
      secondary: { href: "/services", label: "View all services" },
    },
  },
  {
    id: "industries",
    label: "Industries",
    match: ["/industries"],
    groups: [
      {
        title: "Industries we serve",
        items: industries.map((i) => ({ href: `/industries#${i.slug}`, label: i.name, desc: i.tagline })),
      },
    ],
    feature: {
      title: "A certified diverse supplier",
      body: "NMSDC, State of Ohio and City of Columbus certified. Work with us counts toward your supplier-diversity goals.",
      cta: { href: "/certifications", label: "Our certifications" },
    },
  },
  {
    id: "resources",
    label: "Resources",
    match: ["/resources", "/products"],
    groups: [
      {
        title: "Proof",
        items: [
          { href: "/resources/customer-stories", label: "Customer stories", desc: "What our clients say about working with us." },
          { href: "/resources/case-studies", label: "Case studies", desc: "How engagements ran, start to finish." },
        ],
      },
      {
        title: "Insights",
        items: [
          { href: "/resources/blog", label: "Blog", desc: "Practical notes from our engineers and recruiters." },
          { href: "/resources/news", label: "News", desc: "Company announcements and milestones." },
          { href: "/resources/media-kit", label: "Media kit", desc: "Logos, company descriptions and facts for press." },
        ],
      },
      {
        title: "Our products",
        items: [
          { href: "/products", label: "Blue-IQ", desc: "Turns documents into structured data, with a confidence score on every field." },
          { href: "/products#inytes", label: "Inytes", desc: "Digital invitations for celebrations." },
        ],
      },
    ],
    feature: {
      title: "Notes from our teams",
      body: "Practical articles from our engineers, recruiters and delivery leads.",
      cta: { href: "/resources/blog", label: "Read the blog" },
      secondary: { href: "/resources", label: "All resources" },
    },
  },
  {
    id: "company",
    label: "Company",
    match: ["/about", "/how-we-work", "/certifications", "/security", "/careers", "/jobs", "/contact"],
    groups: [
      {
        title: "About Oceanblue",
        items: [
          { href: "/about", label: "About us", desc: "Our story, offices and clients." },
          { href: "/how-we-work", label: "How we work", desc: "Our process and engagement models." },
          { href: "/certifications", label: "Certifications", desc: "MBE, WBE, platform partners and security." },
        ],
      },
      {
        title: "Join us",
        items: [
          { href: "/careers", label: "Careers", desc: "Why work with us and how we hire." },
          { href: "/jobs", label: "Find a job", desc: "Search open roles and apply." },
        ],
      },
    ],
    feature: {
      title: "Talk to us",
      body: `${company.address[0]}, ${company.address[1]}`,
      cta: { href: "/contact", label: "Contact us" },
      secondary: { href: company.tel, label: company.phone },
    },
  },
];

// The sticky bar and its menu float over the page, so they carry depth
const barShadow = "shadow-[0_1px_0_var(--color-mist-200)]"; // taste-skill-ignore: sticky bar
const barShadowScrolled = "shadow-[0_10px_30px_-18px_rgba(6,26,40,0.45)]"; // taste-skill-ignore: sticky bar
const panelShadow = "shadow-[0_30px_60px_-30px_rgba(6,26,40,0.35)]"; // taste-skill-ignore: dropdown overlay

function Chevron({ open }: { open: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className={`size-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="m3 4.5 3 3 3-3" />
    </svg>
  );
}

function ItemLink({ item, onPick, compact = false, touch = false }: { item: Item; onPick?: () => void; compact?: boolean; touch?: boolean }) {
  // touch: the phone menu, names only on a 44px row
  const cls = `group block px-3 transition-colors hover:bg-mist-100 focus-visible:bg-mist-100 ${
    touch ? "flex min-h-11 items-center hover:bg-mist-200 focus-visible:bg-mist-200" : compact ? "py-2" : "py-2.5"
  }`;
  const inner = (
    <>
      <span className="block text-small font-medium text-navy-900 group-hover:text-ocean-700">{item.label}</span>
      {item.desc && !compact && !touch && <span className="mt-0.5 block text-small leading-snug text-mist-600">{item.desc}</span>}
    </>
  );
  return /^(tel:|https?:)/.test(item.href) ? (
    <a href={item.href} className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={item.href} className={cls} onClick={onPick}>
      {inner}
    </Link>
  );
}

export default function Header() {
  const pathname = usePathname();
  // Signed-in staff get their account here in place of the visitor CTAs.
  const { user: staff } = useStaffSession();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  // Hover intent: a short delay so the panel does not flicker as the pointer crosses the bar
  const enter = (id: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpenMenu(id), openMenu ? 0 : 90);
  };
  const leave = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpenMenu(null), 160);
  };

  const active = menus.find((m) => m.id === openMenu);
  const isCurrent = (m: Menu) => m.match.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "#"));

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 bg-mist-0 transition-shadow duration-300 ${scrolled || openMenu ? barShadowScrolled : barShadow}`}
      onMouseLeave={leave}
    >
      <nav aria-label="Main" className="gutter flex h-[72px] items-center justify-between gap-6">
        <Link href="/" aria-label="Oceanblue Solutions home" className="shrink-0">
          <Logo className="h-9 w-[7.6rem]" />
        </Link>

        <ul className="hidden h-full items-center lg:flex" onMouseEnter={() => timer.current && clearTimeout(timer.current)}>
          {menus.map((m) => {
            const open = openMenu === m.id;
            return (
              <li key={m.id} className="flex h-full items-center" onMouseEnter={() => enter(m.id)}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls="mega-panel"
                  onClick={() => setOpenMenu(open ? null : m.id)}
                  className={`relative flex h-full items-center gap-1.5 px-3 text-small transition-colors hover:text-ocean-700 xl:px-4 ${
                    open || isCurrent(m) ? "text-ocean-700" : "text-navy-900"
                  }`}
                >
                  {m.label}
                  <Chevron open={open} />
                  <span
                    aria-hidden
                    className={`absolute inset-x-3 bottom-0 h-0.5 bg-ocean-600 transition-transform duration-300 xl:inset-x-4 ${
                      open || isCurrent(m) ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          {!staff && (
            <>
              <Link
                href="/jobs"
                className={`hidden min-h-11 items-center gap-2 px-4 text-small font-medium active:scale-[0.98] md:inline-flex ${
                  pathname.startsWith("/jobs") ? "bg-navy-900 text-white" : "text-navy-900 ring-2 ring-inset ring-navy-900 btn-fill btn-fill-outline"
                }`}
              >
                <svg aria-hidden viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="2.5" y="6" width="15" height="10.5" rx="1.5" />
                  <path d="M7 6V4.5A1.5 1.5 0 0 1 8.5 3h3A1.5 1.5 0 0 1 13 4.5V6M2.5 10.5h15" />
                </svg>
                Find a job
              </Link>
              {pathname !== "/contact" && (
                <Link
                  href="/contact"
                  className="hidden min-h-11 items-center bg-ocean-600 px-5 text-small font-medium text-white btn-fill btn-fill-ocean active:scale-[0.98] sm:inline-flex"
                >
                  Contact us
                </Link>
              )}
            </>
          )}
          <AccountMenu />
          <button
            type="button"
            className="grid size-11 place-items-center lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
            <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              {mobileOpen ? <path d="M5 5l10 10M15 5 5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
            </svg>
          </button>
        </div>
      </nav>

      {/* One shared mega panel, filled by whichever menu is open */}
      {active && (
        <div
          id="mega-panel"
          className={`absolute inset-x-0 top-full hidden max-h-[calc(100dvh-72px)] overflow-y-auto bg-mist-0 lg:block ${panelShadow}`}
          onMouseEnter={() => timer.current && clearTimeout(timer.current)}
        >
          <div className="gutter mx-auto grid max-w-[90rem] grid-cols-12 gap-8 py-8">
            <div
              className={`col-span-9 grid gap-8 ${
                active.compact ? "grid-cols-[1fr_2fr_1fr]" : active.groups.length === 3 ? "grid-cols-3" : active.groups.length === 2 ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {active.groups.map((g) => (
                <div key={g.title}>
                  <p className="px-3 text-caption font-semibold text-mist-600">
                    {g.href ? (
                      <Link href={g.href} className="hover:text-ocean-700">
                        {g.title}
                      </Link>
                    ) : (
                      g.title
                    )}
                  </p>
                  <ul className={`mt-2 grid gap-0.5 ${active.compact && g.items.length > 5 ? "grid-cols-2 gap-x-4" : active.groups.length === 1 && g.items.length > 3 ? "grid-cols-2 gap-x-4" : ""}`}>
                    {g.items.map((it) => (
                      <li key={it.href + it.label}>
                        <ItemLink item={it} compact={active.compact} onPick={() => setOpenMenu(null)} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <aside className="on-dark col-span-3 flex flex-col justify-between bg-navy-900 p-6 text-mist-50">
              <div>
                <p className="text-body font-semibold leading-snug">{active.feature.title}</p>
                <p className="mt-2 text-small leading-normal text-tide-300">{active.feature.body}</p>
              </div>
              <div className="mt-6 grid gap-3">
                <Link
                  href={active.feature.cta.href}
                  className="flex min-h-11 items-center justify-center bg-cyan-500 px-4 text-small font-medium text-navy-950 btn-fill btn-fill-cyan"
                >
                  {active.feature.cta.label}
                </Link>
                {active.feature.secondary &&
                  (active.feature.secondary.href.startsWith("tel:") ? (
                    <a href={active.feature.secondary.href} className="text-center text-small text-white underline underline-offset-4">
                      {active.feature.secondary.label}
                    </a>
                  ) : (
                    <Link href={active.feature.secondary.href} className="text-center text-small text-white underline underline-offset-4">
                      {active.feature.secondary.label}
                    </Link>
                  ))}
              </div>
            </aside>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div id="mobile-menu" className="max-h-[calc(100dvh-72px)] overflow-y-auto bg-mist-0 pb-8 lg:hidden">
          <ul className="gutter">
            {menus.map((m) => {
              const open = mobileSection === m.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setMobileSection(open ? null : m.id)}
                    className="flex min-h-14 w-full items-center justify-between text-left text-body font-medium"
                  >
                    {m.label}
                    <Chevron open={open} />
                  </button>
                  {open && (
                    <div className="grid gap-3 bg-mist-100 px-2 py-3">
                      {m.groups.map((g) => {
                        // A group whose links all land on one page (a single service's features) is one link
                        const pages = [...new Map(g.items.map((it) => [it.href, it])).values()];
                        if (pages.length === 1) {
                          return <ItemLink key={g.title} item={{ href: pages[0].href, label: g.title }} touch />;
                        }
                        return (
                          <div key={g.title}>
                            {g.href ? (
                              <Link href={g.href} className="flex min-h-11 items-center px-3 text-caption font-semibold text-mist-600 hover:text-navy-900">
                                {g.title}
                              </Link>
                            ) : (
                              <p className="px-3 text-caption font-semibold text-mist-600">{g.title}</p>
                            )}
                            {/* Two columns on phones so long menus stay short */}
                            <ul className={`grid ${m.compact ? "grid-cols-2" : ""}`}>
                              {g.items.map((it) => (
                                <li key={it.href + it.label} className="min-w-0">
                                  <ItemLink item={it} touch />
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <MobileAccount />
          <div className="gutter mt-6 grid gap-3">
            {!staff && (
              <>
                <Link href="/jobs" className="flex min-h-12 items-center justify-center bg-navy-900 font-medium text-white btn-fill btn-fill-navy">
                  Find a job
                </Link>
                {pathname !== "/contact" && (
                  <Link href="/contact" className="flex min-h-12 items-center justify-center bg-ocean-600 font-medium text-white btn-fill btn-fill-ocean">
                    Contact us
                  </Link>
                )}
              </>
            )}
            <a href={company.tel} className="flex min-h-12 items-center justify-center bg-mist-100 font-medium btn-fill btn-fill-mist">
              Call {company.phoneShort}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
