"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ActiveFilters, FilterMenu, type PillOption } from "./workspace";
import { FormSelect } from "./forms/primitives";

// The list-page frame: a plain header, then one panel holding the toolbar and
// the grid. Every data-table screen uses these so they read as one product.

/** Title, one line of context, and the page's actions on the right. */
export function ListHeader({
  title,
  meta,
  actions,
  className,
}: {
  title: string;
  /** One line under the title: counts, what needs attention. */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-4 flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="min-w-0">
        <h1 className="text-adm-xl font-semibold leading-7 tracking-[-0.02em] text-[var(--adm-ink)]">{title}</h1>
        {meta && <p className="mt-0.5 text-adm-xs text-[var(--adm-ink-mute)]">{meta}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Emphasis inside ListHeader's meta line, e.g. "5 awaiting a reply". */
export function MetaStrong({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-[var(--adm-ink)]">{children}</span>;
}

export interface ListTab<K extends string = string> {
  key: K;
  label: string;
  count?: number;
}

/** Segmented view switch for the primary filter, usually status. */
export function ListTabs<K extends string>({
  label,
  tabs,
  value,
  onChange,
  className,
}: {
  label: string;
  tabs: ListTab<K>[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "flex h-9 max-w-full flex-none overflow-x-auto rounded-[var(--adm-radius-control)] bg-[var(--adm-surface-2)] p-0.5 [scrollbar-width:none]",
        className,
      )}
    >
      {/* Empty views are hidden unless selected: fewer choices, same reach (Hick). */}
      {tabs.filter((t, i) => i === 0 || t.key === value || t.count === undefined || t.count > 0).map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={cn(
              "inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-[calc(var(--adm-radius-control)-2px)] px-3 text-adm-xs transition-colors",
              active
                ? "bg-[var(--adm-surface)] font-semibold text-[var(--adm-ink)] shadow-[var(--adm-shadow-sm)]"
                : "font-medium text-[var(--adm-ink-mute)] hover:text-[var(--adm-ink)]",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={cn("tabular-nums", active ? "text-[var(--adm-ink-mute)]" : "text-[var(--adm-ink-subtle)]")}>
                {t.count.toLocaleString()}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The band at the top of the panel: tabs and search on the left, Filters and
 * Display on the right. One line on a laptop; on a phone the two buttons wrap
 * under the search together.
 */
export function ListToolbar({
  tabs,
  search,
  children,
  className,
}: {
  tabs?: React.ReactNode;
  search?: React.ReactNode;
  /** Filters and Display, right-aligned. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 border-b border-[var(--adm-line)] px-3 py-3 lg:px-4", className)}>
      {tabs}
      {search}
      {children && <div className="ml-auto flex flex-none items-center gap-2">{children}</div>}
    </div>
  );
}

export interface ListFilter {
  key: string;
  label: string;
  value: string;
  options: readonly PillOption<string>[];
  onChange: (value: string) => void;
  /** The "no filter" value; "all" unless said otherwise. */
  allValue?: string;
}

const isSet = (f: ListFilter) => f.value !== (f.allValue ?? "all");

/** A compact labelled field for the Filters panel. */
export function FilterField({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-adm-xs font-medium text-[var(--adm-ink-mute)]">{label}</label>
      {children}
    </div>
  );
}

/**
 * Every secondary filter behind one "Filters" button, as labelled fields.
 * One control in the toolbar, however many dimensions a screen has.
 */
export function FilterSet({ filters, children }: { filters: ListFilter[]; children?: React.ReactNode }) {
  if (filters.length === 0) return null;
  return (
    <FilterMenu
      activeCount={filters.filter(isSet).length}
      onClearAll={() => filters.forEach((f) => isSet(f) && f.onChange(f.allValue ?? "all"))}
    >
      {filters.map((f) => (
        <FilterField key={f.key} label={f.label} htmlFor={`filter-${f.key}`}>
          <FormSelect
            id={`filter-${f.key}`}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className={cn("h-8 text-adm-xs", isSet(f) && "border-[var(--adm-accent)]")}
          >
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}{o.count !== undefined ? ` (${o.count})` : ""}
              </option>
            ))}
          </FormSelect>
        </FilterField>
      ))}
      {children}
    </FilterMenu>
  );
}

/** What the list is filtered by, each removable, under the toolbar. Hidden when nothing is set. */
export function FilterChips({ filters }: { filters: ListFilter[] }) {
  const set = filters.filter(isSet);
  return (
    <ActiveFilters
      chips={set.map((f) => ({
        label: `${f.label}: ${f.options.find((o) => o.value === f.value)?.label ?? f.value}`,
        onClear: () => f.onChange(f.allValue ?? "all"),
      }))}
      onClearAll={() => set.forEach((f) => f.onChange(f.allValue ?? "all"))}
    />
  );
}
