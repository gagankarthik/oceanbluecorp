"use client";

import { Children, isValidElement, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "../icons";
import type { Section } from "./tone";
import { useInSheet } from "./insights";
import { navItemFor } from "../chrome";
import { BTN_PRIMARY, BTN_SECONDARY } from "./list-chrome";

/**
 * Page container: the one vertical rhythm (24px between blocks) and the content width.
 * Gutters come from <main> in PortalShell, so never pad a page. A `PageHeader` among the
 * children is lifted out and drawn full width above the content, as Plane's header bar.
 * - `default`: up to 1600px, for lists and dashboards
 * - `narrow`: up to 64rem, for forms, settings and single records
 * - `full`: no cap, for boards that need every pixel
 */
export function Page({
  children,
  width = "default",
  className = "",
  label,
  tinted = false,
}: {
  /** Pages built from cards: a light grey ground so the white cards stand out */
  tinted?: boolean;
  children: React.ReactNode;
  width?: "default" | "narrow" | "full";
  className?: string;
  /** aria-label when the page has no visible h1 (rare) */
  label?: string;
}) {
  // Everything starts at the same left edge and uses the width; only a focused form centres
  const max = width === "narrow" ? "mx-auto max-w-5xl" : "";
  const kids = Children.toArray(children);
  const head = kids.find((k) => isValidElement(k) && k.type === PageHeader);
  const rest = head ? kids.filter((k) => k !== head) : kids;
  return (
    <div
      aria-label={label}
      className={`grid min-w-0 content-start gap-6 ${head ? "-mt-5 sm:-mt-6 lg:-mt-8" : ""} ${
        tinted ? "-mx-5 -mb-5 flex-1 bg-mist-50 px-5 pb-5 sm:-mx-6 sm:-mb-6 sm:px-6 sm:pb-6 lg:-mx-8 lg:-mb-8 lg:px-8 lg:pb-8" : ""
      }`}
    >
      {head}
      <div className={`grid w-full min-w-0 content-start gap-6 ${max} ${className}`}>{rest}</div>
    </div>
  );
}

/**
 * Plane's page header: a 44px bar across the top of the page, pinned while it scrolls, with
 * the trail (Clients › Acme) ending in this page's title as its h1, a status beside it and
 * the actions on the right. Under it, only what the bar can't hold: the description and tabs.
 */
export function PageHeader({
  title,
  description,
  actions,
  back,
  tabs,
  meta,
  hero = false,
  leading,
}: {
  /** Records: the title also shows large on the page, with `leading` (an avatar) beside it */
  hero?: boolean;
  leading?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Accepted for existing call sites; the trail takes its icon from the sidebar */
  icon?: IconName;
  actions?: React.ReactNode;
  /** Accepted for existing call sites */
  section?: Section;
  /** The page above this one, e.g. { href: "/portal/clients", label: "Clients" } */
  back?: { href: string; label: string };
  /** Under the bar: view tabs or a segmented control */
  tabs?: React.ReactNode;
  /** Beside the title: a status badge, a count */
  meta?: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/portal";
  const parent = back ? navItemFor(back.href) : navItemFor(pathname);
  return (
    <header className="contents">
      {/* Sticky offsets count from <main>'s padding edge, so the bar pins at minus the gutter: flush to the top */}
      <div className="ph-bar sticky -top-5 z-20 -mx-5 sm:-top-6 lg:-top-8 flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 border-b border-mist-200 bg-mist-0 px-4 py-1.5 sm:-mx-6 lg:-mx-8">
        <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1">
          {back && (
            <>
              <Link href={back.href} className="flex h-7 min-w-0 shrink-0 items-center gap-2 rounded-md px-1.5 text-adm-base font-medium text-mist-700 transition-colors duration-150 hover:bg-mist-100 hover:text-navy-900">
                {parent && <Icon name={parent.icon} className="size-4 shrink-0 text-mist-600" />}
                <span className="truncate">{back.label}</span>
              </Link>
              <Icon name="chevronRight" className="size-3.5 shrink-0 text-mist-400" />
            </>
          )}
          {!back && parent && <Icon name={parent.icon} className="ml-1.5 size-4 shrink-0 text-mist-600" />}
          {hero ? (
            <span aria-current="page" className="min-w-0 truncate px-1.5 text-adm-base font-medium text-navy-900">{title}</span>
          ) : (
            <>
              <h1 className="min-w-0 truncate px-1.5 text-adm-base font-medium text-navy-900">{title}</h1>
              {meta && <span className="flex shrink-0 items-center gap-2">{meta}</span>}
            </>
          )}
        </nav>
        {actions && <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}
      </div>
      {/* A record names itself on the page: large title, its avatar and status, then the line under it */}
      {hero && (
        <div className="kit-fade flex min-w-0 items-start gap-4">
          {leading}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 className="min-w-0 break-words text-adm-xl font-semibold leading-tight tracking-tight text-navy-900">{title}</h1>
              {meta}
            </div>
            {description && <div className="mt-1.5 text-adm-base text-mist-600">{description}</div>}
          </div>
        </div>
      )}
      {((!hero && description) || tabs) && (
        <div className="grid min-w-0 gap-4">
          {!hero && description && <div className="max-w-[65ch] text-adm-base text-mist-600">{description}</div>}
          {tabs && <div className="min-w-0">{tabs}</div>}
        </div>
      )}
    </header>
  );
}

/** Titled white card. `padded={false}` for tables and lists that run edge to edge. */
export function Panel({
  title,
  description,
  action,
  children,
  className = "",
  padded = true,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Header-right controls: a Segmented, a link, a small button */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`flex min-w-0 flex-col rounded-lg bg-mist-0 ring-1 ring-mist-200 ${className}`}>
      {(title || action) && (
        <header className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-mist-200 px-4 py-2">
          <div className="min-w-0">
            {title && <h2 className="truncate text-adm-base font-medium text-navy-900">{title}</h2>}
            {description && <p className="text-adm-xs text-mist-600">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={`flex-1 ${padded ? "p-4" : ""}`}>{children}</div>
    </section>
  );
}

const kpiCols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 xl:grid-cols-4" } as const;

/**
 * KPI cards (StatCard, or KpiButton-wrapped StatCards): one column on phones,
 * two from sm, then 3 or 4 across. Columns follow the child count unless `cols` is set.
 */
export function KpiRow({ children, cols, className = "" }: { children: React.ReactNode; cols?: 2 | 3 | 4; className?: string }) {
  const n = cols ?? (Math.min(4, Math.max(2, Children.toArray(children).length)) as 2 | 3 | 4);
  // Three across from sm leaves an orphan; the third card spans until lg.
  const orphan = n === 3 ? "sm:max-lg:[&>*:nth-child(3)]:col-span-2" : "";
  // Gap wider than the cards' 16px padding, so each card reads as its own unit
  return <div className={`grid grid-cols-1 gap-4 [&>*]:h-full ${kpiCols[n]} ${orphan} ${className}`}>{children}</div>;
}

/**
 * One primary chart (2/3) and one supporting visual (1/3), stacked below lg.
 * Both columns stretch to the taller one. `more` hides further charts behind a toggle.
 */
export function InsightsRow({
  primary,
  side,
  more,
  className = "",
}: {
  primary: React.ReactNode;
  side?: React.ReactNode;
  more?: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // In the insights sheet everything shows, one chart under another
  if (useInSheet()) {
    return (
      <section aria-label="Insights" className="grid gap-5 [&>*]:min-w-0">
        {primary}
        {side}
        {more}
      </section>
    );
  }
  return (
    <section aria-label="Insights" className={`grid gap-4 ${className}`}>
      <div className={`grid gap-6 ${side ? "lg:grid-cols-3" : ""}`}>
        <div className={`flex min-w-0 flex-col [&>*]:flex-1 ${side ? "lg:col-span-2" : ""}`}>{primary}</div>
        {side && <div className="flex min-w-0 flex-col [&>*]:flex-1">{side}</div>}
      </div>
      {more && (
        <div>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-adm-base font-medium text-ocean-700 transition-colors duration-150 hover:bg-ocean-50"
          >
            <Icon name="chevronDown" className={`size-4 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
            {open ? "Hide more insights" : "Show more insights"}
          </button>
          {open && <div className="mt-3 grid gap-6 lg:grid-cols-2">{more}</div>}
        </div>
      )}
    </section>
  );
}

/**
 * A list page, laid out as Plane's: edge to edge in the work surface and filling the
 * height, so a `fill` DataTable inside scrolls its rows and pins its footer. The shell header
 * shows the section name; `title` is the page's heading for screen readers.
 */
export function ListPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="-m-5 flex h-[calc(100svh-3.75rem-2px)] min-h-[32rem] flex-col bg-mist-0 sm:-m-6 lg:-m-8">
      <h1 className="sr-only">{title}</h1>
      {children}
    </div>
  );
}

/** Loading, error and empty states inside a ListPage keep a gutter. */
export function ListPageState({ children }: { children: React.ReactNode }) {
  return <div className="p-4 sm:p-6">{children}</div>;
}

const PILL_TONE = { primary: BTN_PRIMARY, secondary: BTN_SECONDARY };

/** Plane's 28px button, for list headers: Export, Add, Insights. */
export function PillButton({
  children,
  icon,
  href,
  onClick,
  variant = "secondary",
  disabled,
  label,
}: {
  children?: React.ReactNode;
  icon?: IconName;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  /** Accessible name when the pill is icon-only */
  label?: string;
}) {
  const cls = `${PILL_TONE[variant]} ${children ? "" : "w-8 px-0"}`;
  const body = (
    <>
      {icon && <Icon name={icon} className="size-4" />}
      {children}
    </>
  );
  return href ? (
    <Link href={href} aria-label={label} title={label} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={cls}>
      {body}
    </button>
  );
}
