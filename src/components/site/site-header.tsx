"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/lib/auth/config";
import { useStaffSession, signOutStaff } from "./use-staff-session";
import { LinkButton } from "./button";
import {
  IconMenu, IconX, IconChevronDown, IconArrowRight, IconTalent, IconHardHat, IconCloudUp, IconShieldLock,
  IconLayers, IconCrm, IconChip, IconServer, IconGraduation, IconTransform, IconCaseStudy, IconStory,
  IconPencil, IconNewspaper, IconDocsCode, IconPackage, IconBuilding, IconTeam, IconBriefcase, IconMail,
  IconUser, IconSettings, IconLogout, IconOverview, IconKey, type Icon,
} from "./icons";

type Item = { href: string; label: string; icon: Icon };
type Group = {
  key: string;
  label: string;
  title: string;
  intro: string;
  items: Item[];
  feature: { title: string; body: string; href: string; cta: string };
};

const MENUS: Group[] = [
  {
    key: "solutions",
    label: "Solutions",
    title: "Solutions",
    intro: "Talent, engineering, platforms, operations and training from one accountable partner.",
    items: [
      { href: "/solutions/staffing", label: "IT Staffing & Talent", icon: IconTalent },
      { href: "/solutions/engineering", label: "Engineering Talent", icon: IconHardHat },
      { href: "/solutions/cloud", label: "Cloud Engineering", icon: IconCloudUp },
      { href: "/solutions/cybersecurity", label: "Cybersecurity", icon: IconShieldLock },
      { href: "/solutions/erp", label: "ERP Solutions", icon: IconLayers },
      { href: "/solutions/salesforce", label: "Salesforce Services", icon: IconCrm },
      { href: "/solutions/ai", label: "AI & Data Intelligence", icon: IconChip },
      { href: "/solutions/managed", label: "Managed Services", icon: IconServer },
      { href: "/solutions/training", label: "Training & Upskilling", icon: IconGraduation },
      { href: "/solutions/transformation", label: "Digital Transformation", icon: IconTransform },
    ],
    feature: {
      title: "Not sure where it fits?",
      body: "Tell us the problem and we will route it to the right practice.",
      href: "/contact",
      cta: "Talk to us",
    },
  },
  {
    key: "resources",
    label: "Resources",
    title: "Resources",
    intro: "Case studies, writing and tools from the people doing the work.",
    items: [
      { href: "/case-studies", label: "Case studies", icon: IconCaseStudy },
      { href: "/customer-stories", label: "Customer stories", icon: IconStory },
      { href: "/blog", label: "Blog", icon: IconPencil },
      { href: "/news", label: "News", icon: IconNewspaper },
      { href: "/developers", label: "Developer docs", icon: IconDocsCode },
      { href: "/products", label: "Products", icon: IconPackage },
    ],
    feature: {
      title: "From the blog",
      body: "What our engineers and recruiters are learning on hiring, delivery and the platforms we run.",
      href: "/blog",
      cta: "Read the blog",
    },
  },
  {
    key: "company",
    label: "Company",
    title: "Company",
    intro: "Who we are, the people behind the work, and how to reach us.",
    items: [
      { href: "/about", label: "About us", icon: IconBuilding },
      { href: "/team", label: "Our team", icon: IconTeam },
      { href: "/careers", label: "Careers", icon: IconBriefcase },
      { href: "/contact", label: "Contact us", icon: IconMail },
      { href: "https://hr.oceanbluecorp.com", label: "HR portal", icon: IconUser },
      { href: "/auth/signin", label: "Staff sign in", icon: IconKey },
    ],
    feature: {
      title: "A certified diverse supplier",
      body: "NMSDC, Ohio MBE and WBE, and City of Columbus MBE certified.",
      href: "/about",
      cta: "About Oceanblue",
    },
  },
];

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="Oceanblue Solutions, Inc., home" className={cn("flex items-center", className)}>
      <Image src="/brand/oceanblue-logo-small.svg" alt="Oceanblue Solutions, Inc." width={135} height={40} priority className="h-9 w-auto md:h-10" />
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
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  // Set when a menu is opened by click/Enter (not hover): focus then moves
  // into the panel so Tab reaches its links next (WCAG 2.4.3).
  const focusPanel = useRef(false);
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
        // Return focus to the trigger rather than letting it fall to <body>
        // when the panel it was in unmounts.
        const inPanel = panelRef.current?.contains(document.activeElement);
        setMenu((open) => {
          if (open && inPanel) triggerRefs.current[open]?.focus();
          return null;
        });
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

  useEffect(() => {
    if (menu && focusPanel.current) panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    focusPanel.current = false;
  }, [menu]);

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
              ref={(el) => {
                triggerRefs.current[m.key] = el;
              }}
              type="button"
              onMouseEnter={() => openMenu(m.key)}
              onClick={() => {
                const opening = menu !== m.key;
                focusPanel.current = opening;
                setMenu(opening ? m.key : null);
              }}
              aria-expanded={menu === m.key}
              aria-controls="site-mega-menu"
              className={cn(
                "relative inline-flex h-10 items-center gap-1.5 px-4 text-[0.9375rem] font-medium transition-colors duration-[var(--dur-short)]",
                "after:absolute after:inset-x-4 after:bottom-0.5 after:h-0.5 after:origin-center after:rounded-full after:bg-cobalt after:transition-transform after:duration-200 after:ease-out",
                menu === m.key ? "text-ink after:scale-x-100" : "text-ink-muted after:scale-x-0 hover:text-ink hover:after:scale-x-100",
              )}
            >
              {m.label}
              <IconChevronDown size={14} className={cn("transition-transform duration-200", menu === m.key && "rotate-180")} />
            </button>
          ))}
        </nav>

        <div data-header-actions className="ml-auto hidden items-center gap-2 justify-self-end md:flex lg:ml-0">
          {/* Visitors cannot have accounts, so signed-out readers get no sign-in
              here; staff use "Staff sign in" in the Company menu or the footer. */}
          {!isLoading && isAuthenticated && (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccount((a) => !a)}
                aria-expanded={account}
                className="inline-flex h-10 items-center gap-2 rounded-full px-3 type-body font-medium text-ink-muted transition-colors duration-[var(--dur-short)] hover:bg-paper hover:text-ink"
              >
                <IconUser size={16} />
                {user?.name?.split(" ")[0] || "Account"}
                <IconChevronDown size={14} className={cn("transition-transform", account && "rotate-180")} />
              </button>
              {account && (
                <div className="menu-in absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-[var(--shadow-overlay)]">
                  <p className="truncate px-3 pt-2 pb-3 type-caption text-ink-subtle">{user?.email}</p>
                  <Link href={dashboard} className="flex min-h-10 items-center gap-3 rounded-xl px-3 type-body font-medium text-ink hover:bg-paper">
                    <IconOverview size={16} /> Dashboard
                  </Link>
                  <a href="https://hr.oceanbluecorp.com/" rel="noopener noreferrer" className="flex min-h-10 items-center gap-3 rounded-xl px-3 type-body font-medium text-ink hover:bg-paper">
                    <IconBriefcase size={16} /> HR portal
                  </a>
                  {user?.role === UserRole.ADMIN && (
                    <Link href="/admin/settings" className="flex min-h-10 items-center gap-3 rounded-xl px-3 type-body font-medium text-ink hover:bg-paper">
                      <IconSettings size={16} /> Settings
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => void signOutStaff()}
                    className="mt-1 flex min-h-10 w-full items-center gap-3 rounded-xl border-t border-line px-3 type-body font-medium text-danger hover:bg-danger-container"
                  >
                    <IconLogout size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          )}
          {/* One primary and one secondary: "Talk to us" is the header's action,
              "Find a job" the outlined alternative for candidates. */}
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
          className="ml-auto grid size-11 place-items-center rounded-full text-ink hover:bg-paper md:ml-0 lg:hidden"
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
          ref={panelRef}
          id="site-mega-menu"
          onKeyDown={(e) => {
            // The panel sits at the end of <header>; send Tab back to the nav so
            // the order reads trigger -> panel -> next trigger.
            if (e.key !== "Tab" || !panelRef.current) return;
            const items = panelRef.current.querySelectorAll<HTMLElement>("a, button");
            const first = items[0];
            const last = items[items.length - 1];
            const keys = MENUS.map((m) => m.key);
            const idx = keys.indexOf(current.key);
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              triggerRefs.current[current.key]?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              const next = triggerRefs.current[keys[idx + 1]];
              // After the last menu, continue to the header actions.
              const after = next ?? panelRef.current.closest("header")?.querySelector<HTMLElement>("[data-header-actions] a, [data-header-actions] button");
              if (after) {
                e.preventDefault();
                setMenu(null);
                after.focus();
              }
            }
          }}
          className="menu-in absolute inset-x-0 top-full hidden border-b border-line bg-white shadow-[var(--shadow-overlay)] lg:block"
          onMouseEnter={() => openMenu(current.key)}
        >
          <div className="mx-auto grid max-w-[var(--grid-max)] grid-cols-[220px_minmax(0,1fr)_280px] gap-10 px-6 py-8">
            <div className="self-start">
              <p className="type-title-lg leading-none text-ink">{current.title}</p>
              <p className="mt-3 type-body-sm text-ink-subtle">{current.intro}</p>
            </div>
            <ul className="grid min-h-[236px] grid-cols-2 content-start gap-x-6 gap-y-1 border-l border-line pl-8">
              {current.items.map((i) => (
                <li key={i.href}>
                  <MenuItem i={i} />
                </li>
              ))}
            </ul>
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
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 type-body font-semibold text-ink">
                {m.label}
                <IconChevronDown size={16} className="text-ink-subtle transition-transform group-open:rotate-180" />
              </summary>
              <ul className="pb-3">
                {m.items.map((i) => (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      rel={i.href.startsWith("/auth") ? "nofollow" : undefined}
                      className="flex min-h-11 items-center gap-3 rounded-lg py-2"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line text-ink">
                        <i.icon size={16} />
                      </span>
                      <span className="type-body font-medium text-ink">{i.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
          <div className="grid gap-2 pt-5">
            <LinkButton href="/contact" variant="primary" size="md">
              Talk to us
            </LinkButton>
            <div className={cn("grid gap-2", isAuthenticated && "grid-cols-2")}>
              <LinkButton href="/careers/search" variant="outline" size="md">
                Find a job
              </LinkButton>
              {isAuthenticated && (
                <LinkButton href={dashboard} variant="outline" size="md">
                  Dashboard
                </LinkButton>
              )}
            </div>
            {isAuthenticated && (
              <button type="button" onClick={() => void signOutStaff()} className="mt-1 min-h-11 type-body font-medium text-danger">
                Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MenuItem({ i }: { i: Item }) {
  return (
    <Link href={i.href} rel={i.href.startsWith("/auth") ? "nofollow" : undefined} className="group flex min-h-11 items-center gap-3 rounded-xl px-3 py-1.5 transition-colors hover:bg-paper">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors duration-[var(--dur-short)] group-hover:border-cobalt-tint group-hover:bg-cobalt-tint group-hover:text-cobalt">
        <i.icon size={16} />
      </span>
      <span className="type-body-sm leading-snug font-semibold text-ink">{i.label}</span>
    </Link>
  );
}

function FeatureCard({ f }: { f: Group["feature"] }) {
  return (
    <Link href={f.href} className="group flex flex-col rounded-2xl bg-paper px-5 pt-4 pb-5 transition-colors hover:bg-paper-deep">
      <p className="type-body leading-none font-semibold text-ink">{f.title}</p>
      <p className="mt-2 type-body-sm text-ink-subtle">{f.body}</p>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-4 type-label text-cobalt">
        {f.cta} <IconArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
