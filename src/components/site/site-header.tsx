"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/lib/auth/config";
import { useStaffSession, signOutStaff } from "./use-staff-session";
import { LinkButton } from "./button";
import { GeoStack, GeoBooks, GeoLattice } from "./geo-art";
import {
  IconMenu, IconX, IconChevronDown, IconArrowRight, IconTalent, IconHardHat, IconCloudUp, IconShieldLock,
  IconLayers, IconCrm, IconChip, IconServer, IconGraduation, IconTransform, IconCaseStudy, IconStory,
  IconPencil, IconNewspaper, IconDocsCode, IconPackage, IconSwatches, IconBuilding, IconTeam, IconBriefcase, IconMail,
  IconUser, IconSettings, IconLogout, IconOverview, type Icon,
} from "./icons";

/** `external` opens in a new tab. */
type Item = { href: string; label: string; desc: string; icon: Icon; external?: boolean };
type Group = {
  key: string;
  label: string;
  title: string;
  intro: string;
  items: Item[];
  /** Split the items into labelled columns; used where a flat grid runs long. */
  columns?: { heading: string; hrefs: string[] }[];
  feature: { title: string; body: string; href: string; cta: string; art: "stack" | "books" | "lattice" };
};

/* Descriptions are lifted from each destination's own copy, so the menu never
   promises something the page does not. */
const MENUS: Group[] = [
  {
    key: "solutions",
    label: "Solutions",
    title: "Solutions",
    intro: "Talent, engineering, platforms, operations and training from one accountable partner.",
    items: [
      { href: "/solutions/staffing", label: "IT Staffing & Talent", desc: "Specialists who deliver from the first sprint", icon: IconTalent },
      { href: "/solutions/engineering", label: "Engineering Talent", desc: "Mechanical, electrical, aerospace and controls", icon: IconHardHat },
      { href: "/solutions/cloud", label: "Cloud Engineering", desc: "Migrate and modernize without downtime", icon: IconCloudUp },
      { href: "/solutions/cybersecurity", label: "Cybersecurity", desc: "Protect cloud, identity and applications", icon: IconShieldLock },
      { href: "/solutions/erp", label: "ERP Solutions", desc: "SAP, Oracle and Dynamics that fit how you work", icon: IconLayers },
      { href: "/solutions/salesforce", label: "Salesforce Services", desc: "Salesforce that works the way your teams do", icon: IconCrm },
      { href: "/solutions/ai", label: "AI & Data Intelligence", desc: "Practical AI, secure and built for the business", icon: IconChip },
      { href: "/solutions/managed", label: "Managed Services", desc: "Run and optimize, 24/7, on one SLA", icon: IconServer },
      { href: "/solutions/training", label: "Training & Upskilling", desc: "Instructor-led training on the stack you run", icon: IconGraduation },
      { href: "/solutions/transformation", label: "Digital Transformation", desc: "A roadmap with measurable outcomes", icon: IconTransform },
    ],
    columns: [
      { heading: "Practices", hrefs: ["/solutions/staffing", "/solutions/engineering", "/solutions/managed", "/solutions/training"] },
      { heading: "Platforms & cloud", hrefs: ["/solutions/cloud", "/solutions/cybersecurity", "/solutions/erp", "/solutions/salesforce"] },
      { heading: "Data & change", hrefs: ["/solutions/ai", "/solutions/transformation"] },
    ],
    feature: {
      title: "Not sure where it fits?",
      body: "Tell us the problem. We will route it to the right practice and come back with a plan.",
      href: "/contact",
      cta: "Talk to us",
      art: "stack",
    },
  },
  {
    key: "resources",
    label: "Resources",
    title: "Resources",
    intro: "Case studies, writing and tools from the people doing the work.",
    items: [
      { href: "/case-studies", label: "Case studies", desc: "The problem, the team, what changed", icon: IconCaseStudy },
      { href: "/customer-stories", label: "Customer stories", desc: "Working with us, in their words", icon: IconStory },
      { href: "/blog", label: "Blog", desc: "Notes from the people doing the work", icon: IconPencil },
      { href: "/news", label: "News", desc: "Announcements, certifications, milestones", icon: IconNewspaper },
      { href: "/developers", label: "Developer docs", desc: "The Job Feed API: auth, endpoints, schemas", icon: IconDocsCode },
      { href: "/products", label: "Products", desc: "Software we own end to end", icon: IconPackage },
      { href: "/brand-kit", label: "Media kit", desc: "Logos, colours and how to use them", icon: IconSwatches },
    ],
    feature: {
      title: "Notes from the people doing the work",
      body: "What our engineers and recruiters are learning on hiring, delivery and the platforms we run.",
      href: "/blog",
      cta: "Read the blog",
      art: "books",
    },
  },
  {
    key: "company",
    label: "Company",
    title: "Company",
    intro: "Who we are, the people behind the work, and how to reach us.",
    items: [
      { href: "/about", label: "About us", desc: "Our story, our standard and our certifications", icon: IconBuilding },
      { href: "/team", label: "Our team", desc: "The people who lead the engagements", icon: IconTeam },
      { href: "/careers", label: "Careers", desc: "What the work is like, and how we hire", icon: IconBriefcase },
      { href: "/contact", label: "Contact us", desc: "Sales, partnerships and general enquiries", icon: IconMail },
      { href: "https://hr.oceanbluecorp.com", label: "HR platform", desc: "Leave, attendance, documents and the handbook", icon: IconUser, external: true },
    ],
    feature: {
      title: "A certified diverse supplier",
      body: "NMSDC, Ohio MBE and WBE, and City of Columbus MBE certified.",
      href: "/about",
      cta: "About Ocean Blue",
      art: "lattice",
    },
  },
];

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="Ocean Blue Corporation, home" className={cn("flex items-center", className)}>
      <Image src="/logo.webp" alt="Ocean Blue Corporation" width={150} height={40} priority className="h-8 w-auto" />
    </Link>
  );
}

export function SiteHeader({ topOffset = "top-0" }: { topOffset?: string }) {
  const [mobile, setMobile] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [account, setAccount] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const { user, isAuthenticated, isLoading } = useStaffSession();

  useEffect(() => {
    setMenu(null);
    setMobile(false);
    setAccount(false);
  }, [path]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
        setAccount(false);
        // The panel only exists while open.
        if (mobileRef.current) toggleRef.current?.focus();
        setMobile(false);
      }
    };
    const onDown = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccount(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  // Opening moves focus into the panel; Tab past either end wraps back to the toggle.
  useEffect(() => {
    if (mobile) mobileRef.current?.querySelector<HTMLElement>("summary, a, button")?.focus();
  }, [mobile]);

  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobile]);

  const openMenu = (k: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenu(k);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setMenu(null), 140);
  };
  const current = MENUS.find((m) => m.key === menu);
  // Every signed-in user is staff, so this always points into the admin area.
  const dashboard = user?.role === UserRole.HR ? "/admin/applications" : "/admin";

  return (
    <header
      className={cn("site fixed inset-x-0 z-[9999] border-b border-line bg-white/95 backdrop-blur-md transition-[top] duration-300", topOffset)}
      onMouseLeave={scheduleClose}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-4 sm:px-6 md:h-[68px] lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-8">
        <Wordmark className="justify-self-start" />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {MENUS.map((m) => (
            <button
              key={m.key}
              type="button"
              onMouseEnter={() => openMenu(m.key)}
              onClick={() => setMenu(menu === m.key ? null : m.key)}
              aria-expanded={menu === m.key}
              aria-haspopup="true"
              className={cn(
                "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[14.5px] font-medium transition-colors",
                menu === m.key ? "bg-paper text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              {m.label}
              <IconChevronDown size={14} className={cn("transition-transform duration-200", menu === m.key && "rotate-180")} />
            </button>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 justify-self-end md:flex lg:ml-0">
          {isLoading ? (
            <span className="h-8 w-16 animate-pulse rounded-full bg-paper" />
          ) : isAuthenticated ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccount((a) => !a)}
                aria-expanded={account}
                className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-[14.5px] font-medium text-ink-muted hover:bg-paper hover:text-ink"
              >
                <IconUser size={16} />
                {user?.name?.split(" ")[0] || "Account"}
                <IconChevronDown size={14} className={cn("transition-transform", account && "rotate-180")} />
              </button>
              {account && (
                <div className="menu-in absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-[var(--shadow-overlay)]">
                  <p className="truncate px-3 pt-2 pb-2.5 text-[12.5px] text-ink-subtle">{user?.email}</p>
                  <Link href={dashboard} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[14px] font-medium text-ink hover:bg-paper">
                    <IconOverview size={16} /> Dashboard
                  </Link>
                  <a href="https://hr.oceanbluecorp.com/" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[14px] font-medium text-ink hover:bg-paper">
                    <IconBriefcase size={16} /> HR platform
                  </a>
                  {user?.role === UserRole.ADMIN && (
                    <Link href="/admin/settings" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[14px] font-medium text-ink hover:bg-paper">
                      <IconSettings size={16} /> Settings
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => void signOutStaff()}
                    className="mt-1 flex w-full items-center gap-2.5 rounded-xl border-t border-line px-3 py-2 text-[14px] font-medium text-danger hover:bg-danger-container"
                  >
                    <IconLogout size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/signin" className="inline-flex h-10 items-center rounded-full px-3 text-[14.5px] font-medium text-ink-muted transition-colors hover:bg-paper hover:text-ink">
              Sign in
            </Link>
          )}
          {/* Candidates go straight to the job board; Careers sits in the Company menu. */}
          <LinkButton href="/careers/search" variant="outline" className="hidden lg:inline-flex">
            Find a job
          </LinkButton>
          <LinkButton href="/contact" variant="primary">
            Talk to us
          </LinkButton>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="ml-auto rounded-full p-2 text-ink hover:bg-paper md:ml-0 lg:hidden"
          onClick={() => setMobile((o) => !o)}
          aria-label={mobile ? "Close menu" : "Open menu"}
          aria-expanded={mobile}
          aria-controls="site-mobile-menu"
        >
          {mobile ? <IconX size={22} /> : <IconMenu size={22} />}
        </button>
      </div>

      {/* Desktop mega menu: intro, items, and the one thing worth doing next. */}
      {current && (
        <div
          key={current.key}
          className="menu-in absolute inset-x-0 top-full hidden border-b border-line bg-white shadow-[var(--shadow-overlay)] lg:block"
          onMouseEnter={() => openMenu(current.key)}
        >
          <div className="mx-auto grid max-w-[1440px] grid-cols-[220px_minmax(0,1fr)_280px] gap-10 px-8 py-8">
            <div className="border-r border-line pr-8">
              <p className="type-title-lg text-ink">{current.title}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-subtle">{current.intro}</p>
            </div>
            {current.columns ? (
              <div className="grid grid-cols-3 gap-x-4 self-start">
                {current.columns.map((col) => (
                  <div key={col.heading}>
                    <p className="px-3 pb-1 text-[13px] font-medium text-ink-subtle">{col.heading}</p>
                    <ul>
                      {col.hrefs.map((h) => {
                        const i = current.items.find((it) => it.href === h)!;
                        return (
                          <li key={h}>
                            <MenuItem i={i} compact />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 self-start">
                {current.items.map((i) => (
                  <li key={i.href}>
                    <MenuItem i={i} />
                  </li>
                ))}
              </ul>
            )}
            <FeatureCard f={current.feature} />
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobile && (
        <div
          id="site-mobile-menu"
          ref={mobileRef}
          onKeyDown={(e) => {
            if (e.key !== "Tab") return;
            const items = mobileRef.current?.querySelectorAll<HTMLElement>("summary, a[href], button");
            if (!items?.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if ((e.shiftKey && document.activeElement === first) || (!e.shiftKey && document.activeElement === last)) {
              e.preventDefault();
              toggleRef.current?.focus();
            }
          }}
          className="max-h-[calc(100dvh-64px)] overflow-y-auto border-t border-line bg-white px-4 pb-6 lg:hidden"
        >
          {MENUS.map((m) => (
            <details key={m.key} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[16px] font-semibold text-ink">
                {m.label}
                <IconChevronDown size={16} className="text-ink-subtle transition-transform group-open:rotate-180" />
              </summary>
              <ul className="pb-3">
                {m.items.map((i) => (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      {...(i.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="flex items-start gap-3 rounded-lg py-2.5"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line text-ink">
                        <i.icon size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-[14.5px] font-medium text-ink">
                          {i.label}
                        </span>
                        <span className="block text-[13px] text-ink-subtle">{i.desc}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
          <div className="grid gap-2 pt-5">
            <LinkButton href="/contact" variant="primary" size="lg">
              Talk to us
            </LinkButton>
            <div className="grid grid-cols-2 gap-2">
              <LinkButton href="/careers/search" variant="outline" size="lg">
                Find a job
              </LinkButton>
              {isAuthenticated ? (
                <LinkButton href={dashboard} variant="outline" size="lg">
                  Dashboard
                </LinkButton>
              ) : (
                <LinkButton href="/auth/signin" variant="outline" size="lg">
                  Sign in
                </LinkButton>
              )}
            </div>
            {isAuthenticated && (
              <button type="button" onClick={() => void signOutStaff()} className="mt-1 py-2 text-[14px] font-medium text-danger">
                Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/** `compact` drops the description, for the three-column Solutions sheet. */
function MenuItem({ i, compact }: { i: Item; compact?: boolean }) {
  if (compact) {
    return (
      <Link href={i.href} title={i.desc} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-paper">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors group-hover:border-cobalt group-hover:bg-cobalt group-hover:text-white">
          <i.icon size={17} />
        </span>
        <span className="text-[14.5px] leading-snug font-semibold text-ink">{i.label}</span>
      </Link>
    );
  }
  return (
    <Link
      href={i.href}
      {...(i.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex items-start gap-3.5 rounded-xl p-3 transition-colors hover:bg-paper"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors group-hover:border-cobalt group-hover:bg-cobalt group-hover:text-white">
        <i.icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">
          {i.label}
          <IconArrowRight size={14} className="-translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
        </span>
        <span className="mt-0.5 block text-[13.5px] leading-snug text-ink-subtle">{i.desc}</span>
      </span>
    </Link>
  );
}

function FeatureCard({ f }: { f: Group["feature"] }) {
  const Art = f.art === "stack" ? GeoStack : f.art === "books" ? GeoBooks : GeoLattice;
  return (
    <Link href={f.href} className="group block rounded-2xl bg-paper p-5 text-left transition-colors hover:bg-paper-deep">
      <div className="flex h-[118px] items-center justify-center overflow-hidden">
        <Art className="h-[128px] w-auto" />
      </div>
      <p className="mt-3 text-[16px] font-semibold text-ink">{f.title}</p>
      <p className="mt-1 text-[13.5px] leading-relaxed text-ink-subtle">{f.body}</p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink">
        {f.cta} <IconArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
