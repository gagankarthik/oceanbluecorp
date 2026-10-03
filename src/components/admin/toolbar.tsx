"use client";

import * as React from "react";
import type { IconComponent } from "./icons";
import { Search, ChevronDown, X, Check } from "lucide-react";
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

/**
 * Clearable list-page search. Filters as you type, no submit button.
 *
 * Fixed-width rather than `flex-1`. It used to stretch to fill the toolbar,
 * which pushed every other control to the far edge and made the row read as
 * "search, then some leftovers". A search box only needs to fit a name or an
 * ID; the reclaimed space goes to the filters, which now sit beside it.
 */
export function SearchInput({ value, onChange, className, ...props }: SearchInputProps) {
  return (
    <div className={cn("relative w-full sm:w-[340px] lg:w-[420px]", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--adm-ink-subtle)]" />
      <input
        type="search"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
        className="h-9 w-full rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] pl-9 pr-8 text-[13.5px] transition-colors placeholder:text-[var(--adm-ink-subtle)] focus:border-[var(--adm-accent)] focus:bg-[var(--adm-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[6px] p-0.5 text-[var(--adm-ink-subtle)] hover:text-[var(--adm-ink-mute)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Counted filter menu ──────────────────────────────────────────────────────────

export interface FilterOption<V extends string> {
  value: V;
  label: string;
  /** Shown as a trailing tally. Omit when a count is meaningless. */
  count?: number;
}

/**
 * A labelled dropdown of mutually-exclusive options with their counts.
 *
 * Replaces the chip rows. The trigger states the current selection so the row
 * still answers "what am I looking at?" without expanding, and it takes the
 * accent treatment only when the filter is actually narrowing something, a
 * control sitting at "All" is not an active filter and shouldn't look like one.
 */
export function FilterMenu<V extends string>({
  label,
  value,
  options,
  onChange,
  /** The value that means "no filtering", drives the inactive styling. */
  allValue = "all" as V,
  className,
}: {
  label: string;
  value: V;
  options: readonly FilterOption<V>[];
  onChange: (value: V) => void;
  allValue?: V;
  className?: string;
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  const active = value !== allValue;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-2.5 text-[13px] font-medium transition-colors",
            active
              ? "border-[var(--adm-accent)] bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]"
              : "border-[var(--adm-line)] bg-[var(--adm-surface)] text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)]",
            "data-[state=open]:border-[var(--adm-accent)]",
            className,
          )}
        >
          <span className={cn("text-[var(--adm-ink-subtle)]", active && "text-[var(--adm-accent)]/70")}>{label}</span>
          <span className="font-semibold">{current?.label ?? "All"}</span>
          {current?.count !== undefined && (
            <span
              className={cn(
                "rounded-[6px] px-1 text-[11px] font-bold tabular-nums",
                active ? "bg-[var(--adm-accent)]/12 text-[var(--adm-accent)]" : "bg-[var(--adm-surface-2)] text-[var(--adm-ink-subtle)]",
              )}
            >
              {current.count}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>

      {/* sideOffset 4 keeps the menu visually connected to its trigger, a
          detached floating panel reads as a different surface. */}
      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className="min-w-[190px] rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-[var(--adm-shadow-pop)]"
      >
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <DropdownMenuItem
              key={o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px]",
                selected && "font-semibold text-[var(--adm-accent)]",
              )}
            >
              <Check className={cn("h-3.5 w-3.5 flex-none", selected ? "opacity-100" : "opacity-0")} />
              <span className="flex-1 truncate">{o.label}</span>
              {o.count !== undefined && (
                <span className={cn("tabular-nums text-[12px]", selected ? "text-[var(--adm-accent)]" : "text-[var(--adm-ink-subtle)]")}>
                  {o.count}
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── View switcher ──────────────────────────────────────────────────────────────

export interface ViewOption<V extends string> {
  value: V;
  label: string;
  icon: IconComponent;
}

/** Dropdown variant of the view switcher, a "View" button that opens the options. */
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
            "inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-3 text-[13.5px] font-medium text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)] data-[state=open]:bg-[var(--adm-row-hover)]",
            className,
          )}
        >
          <CurrentIcon className="h-4 w-4 text-[var(--adm-ink-subtle)]" />
          <span className="hidden sm:inline">{current.label}</span>
          <ChevronDown className="h-3.5 w-3.5 text-[var(--adm-ink-subtle)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-pop)]">
        {options.map(({ value: v, label, icon: Icon }) => {
          const active = v === value;
          return (
            <DropdownMenuItem
              key={v}
              onClick={() => onChange(v)}
              className={cn("cursor-pointer rounded-[6px] text-sm", active && "font-semibold text-[var(--adm-accent)]")}
            >
              <Icon className={cn("mr-2 h-4 w-4", active ? "text-[var(--adm-accent)]" : "text-[var(--adm-ink-subtle)]")} />
              {label}
              {active && <Check className="ml-auto h-3.5 w-3.5 text-[var(--adm-accent)]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
