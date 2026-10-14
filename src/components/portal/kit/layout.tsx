"use client";

import { Children, useState } from "react";
import BackLink from "@/components/site/BackLink";
import Icon, { type IconName } from "../icons";
import type { Section } from "./tone";
import { useInSheet } from "./insights";

/**
 * Page container: the one vertical rhythm (24px between blocks) and the
 * content width. Gutters come from <main> in PortalShell, so never pad a page.
 * - `default`: up to 1600px, for lists and dashboards
 * - `narrow`: up to 64rem, for forms, settings and single records
 * - `full`: no cap, for boards that need every pixel
 */
export function Page({
  children,
  width = "default",
  className = "",
  label,
}: {
  children: React.ReactNode;
  width?: "default" | "narrow" | "full";
  className?: string;
  /** aria-label when the page has no visible h1 (rare) */
  label?: string;
}) {
  const max = width === "narrow" ? "max-w-5xl" : width === "full" ? "" : "max-w-[1600px]";
  return (
    <div aria-label={label} className={`mx-auto grid w-full min-w-0 content-start gap-6 ${max} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Page title row. Actions sit right from md and wrap under the title below it.
 * `back` puts a BackLink above the title; `tabs` sits under the row for tabs
 * that switch whole sections. Status tabs over a table go in DataTable's `tabs`.
 */
export function PageHeader({
  title,
  description,
  actions,
  back,
  tabs,
  meta,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Accepted for existing call sites; the header no longer draws an icon */
  icon?: IconName;
  actions?: React.ReactNode;
  /** Accepted for existing call sites */
  section?: Section;
  /** Where "back" goes, e.g. { href: "/portal/clients", label: "Clients" } */
  back?: { href: string; label: string };
  /** Under the title row: view tabs or a segmented control */
  tabs?: React.ReactNode;
  /** Beside the title: a status badge, a count */
  meta?: React.ReactNode;
}) {
  return (
    <header className="grid gap-4">
      {back && <BackLink href={back.href} label={back.label} tone="ink" className="-my-2 text-adm-base" />}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="min-w-0 break-words text-adm-xl font-semibold leading-tight tracking-tight text-navy-900">{title}</h1>
              {meta}
            </div>
            {description && <p className="mt-0.5 max-w-[65ch] text-adm-base text-mist-600">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:flex-nowrap md:justify-end">{actions}</div>}
      </div>
      {tabs && <div className="min-w-0">{tabs}</div>}
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
    <section className={`flex min-w-0 flex-col rounded-xl bg-mist-0 ring-1 ring-mist-200 ${className}`}>
      {(title || action) && (
        <header className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-mist-200 px-5 py-2">
          <div className="min-w-0">
            {title && <h2 className="truncate text-adm-md font-semibold text-navy-900">{title}</h2>}
            {description && <p className="text-adm-base text-mist-600">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={`flex-1 ${padded ? "p-5" : ""}`}>{children}</div>
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
  return <div className={`grid grid-cols-1 gap-5 [&>*]:h-full ${kpiCols[n]} ${orphan} ${className}`}>{children}</div>;
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
