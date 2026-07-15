"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Search, SlidersHorizontal, ChevronDown, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * List-page toolbar patterns. Composition (search + filters + view switcher
 * + bulk bar inside an AdminCard) stays in the page; the styling of each
 * piece lives here so the nine list pages stop drifting apart.
 */

// ── Search input ───────────────────────────────────────────────────────────────

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

/** Clearable list-page search. Filters as you type — no submit button. */
export function SearchInput({ value, onChange, className, ...props }: SearchInputProps) {
  return (
    <div className={cn("relative min-w-[200px] flex-1", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-9 text-sm transition-colors placeholder:text-slate-400 focus:border-[var(--adm-accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Filters toggle ─────────────────────────────────────────────────────────────

/** Toggle for the expandable advanced-filter panel; shows the active count. */
export function FilterToggle({
  open,
  activeCount = 0,
  onClick,
  className,
}: {
  open: boolean;
  activeCount?: number;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
        open || activeCount > 0
          ? "border-[var(--adm-accent)] bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]"
          : "border-slate-200 text-slate-600 hover:bg-slate-50",
        className,
      )}
    >
      <SlidersHorizontal className="h-4 w-4" />
      Filters
      {activeCount > 0 && (
        <span className="rounded-full bg-[var(--adm-accent)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
          {activeCount}
        </span>
      )}
      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
    </button>
  );
}

// ── View switcher ──────────────────────────────────────────────────────────────

export interface ViewOption<V extends string> {
  value: V;
  label: string;
  icon: LucideIcon;
}

/** Segmented control for table/kanban/list (or grid/list) view modes. */
export function ViewSwitcher<V extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: readonly ViewOption<V>[];
  value: V;
  onChange: (value: V) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50", className)}>
      {options.map(({ value: v, label, icon: Icon }, i) => (
        <button
          key={v}
          type="button"
          title={label}
          onClick={() => onChange(v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
            i > 0 && "border-l border-slate-200",
            value === v ? "bg-[var(--adm-accent)] text-white" : "text-slate-600 hover:bg-slate-100",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

/** Dropdown variant of the view switcher — a "View" button that opens the options. */
export function ViewMenu<V extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: readonly ViewOption<V>[];
  value: V;
  onChange: (value: V) => void;
  className?: string;
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  const CurrentIcon = current.icon;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 data-[state=open]:bg-slate-50",
            className,
          )}
        >
          <CurrentIcon className="h-4 w-4 text-slate-500" />
          <span className="hidden sm:inline">{current.label}</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 rounded-xl border border-slate-200 bg-white shadow-lg">
        {options.map(({ value: v, label, icon: Icon }) => {
          const active = v === value;
          return (
            <DropdownMenuItem
              key={v}
              onClick={() => onChange(v)}
              className={cn("cursor-pointer rounded-lg text-sm", active && "font-semibold text-[var(--hz-cobalt)]")}
            >
              <Icon className={cn("mr-2 h-4 w-4", active ? "text-[var(--hz-cobalt)]" : "text-slate-400")} />
              {label}
              {active && <Check className="ml-auto h-3.5 w-3.5 text-[var(--hz-cobalt)]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Bulk actions bar ───────────────────────────────────────────────────────────

/** Appears in the toolbar when rows are selected; children are the actions. */
export function BulkBar({
  count,
  onClear,
  children,
  className,
}: {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (count === 0) return null;
  return (
    <div className={cn("ml-auto flex items-center gap-2", className)}>
      <span className="text-xs font-medium tabular-nums text-slate-500">{count} selected</span>
      {children}
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear selection"
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
