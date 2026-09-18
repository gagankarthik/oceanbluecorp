"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// One bordered panel: toolbar, optional filter drawer, table, footer.

export function ListPanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("min-w-0 overflow-hidden rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]", className)}>
      {children}
    </div>
  );
}

export type Segment = {
  key: string;
  label: string;
  count: number;
};

/**
 * Toolbar fused to the top of the panel. Segments carry their own counts, so
 * the page does not need a separate metrics row to tell you how many records
 * are in each state.
 */
export function ListToolbar({
  search,
  segments,
  activeSegment,
  onSegmentChange,
  trailing,
  children,
}: {
  search?: React.ReactNode;
  segments?: Segment[];
  activeSegment?: string;
  onSegmentChange?: (key: string) => void;
  /** Right-aligned controls: filter toggle, view switcher, etc. */
  trailing?: React.ReactNode;
  /** Expanded filter drawer, rendered under the toolbar when open. */
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--adm-line)]">
      <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:gap-4">
        {search && <div className="min-w-0 flex-1">{search}</div>}

        {segments && segments.length > 0 && (
          <div role="tablist" aria-label="Filter by status" className="flex flex-wrap items-center gap-1">
            {segments.map((s) => {
              const active = activeSegment === s.key;
              return (
                <button
                  key={s.key}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => onSegmentChange?.(s.key)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium transition-colors duration-150",
                    active
                      ? "bg-[var(--adm-accent-soft)] font-semibold text-[var(--adm-accent)]"
                      : "text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]",
                  )}
                >
                  {s.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[11.5px] font-medium tabular-nums",
                      active ? "bg-[var(--adm-surface)] text-[var(--adm-accent)]" : "bg-[var(--adm-surface-2)] text-[var(--adm-ink-subtle)]",
                    )}
                  >
                    {s.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {trailing && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{trailing}</div>}
      </div>

      {children && <div className="border-t border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)] p-4">{children}</div>}
    </div>
  );
}

/** Status bar at the foot of the panel. */
export function ListFooter({
  shown,
  total,
  noun,
  children,
}: {
  shown: number;
  total: number;
  /** Plural noun, e.g. "clients". */
  noun: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-4 py-2.5">
      <p className="text-[13px] text-[var(--adm-ink-subtle)]">
        Showing <span className="font-semibold tabular-nums text-[var(--adm-ink-mute)]">{shown}</span>
        {shown !== total && (
          <>
            {" "}of <span className="font-semibold tabular-nums text-[var(--adm-ink-mute)]">{total}</span>
          </>
        )}{" "}
        {noun}
      </p>
      {children}
    </div>
  );
}

/* ── Table primitives ──────────────────────────────────────── */

/** Table element with the shared grid chrome applied. */
export function ListTable({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-[14px]", className)}>{children}</table>
    </div>
  );
}

export function ListHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-[var(--adm-surface-sunken)]">
      <tr className="border-b border-[var(--adm-line)]">{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  align = "left",
  width,
  className,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  /** Explicit width stops one column hogging half the table. */
  width?: string;
  className?: string;
}) {
  return (
    <th
      style={width ? { width } : undefined}
      className={cn(
        "whitespace-nowrap px-4 py-2.5 text-[12.5px] font-medium text-[var(--adm-ink-mute)]",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function ListBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-[var(--adm-line-soft)]">{children}</tbody>;
}

export function Tr({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn("transition-colors duration-150 hover:bg-[var(--adm-row-hover)]", onClick && "cursor-pointer", className)}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  align = "left",
  className,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

/**
 * Placeholder for an empty cell. A quiet dash reads as "nothing here"; the
 * grey sentences that used to fill these ("No contact info", "No location")
 * repeated down the page and drew more attention than the real values.
 */
export function Empty() {
  return <span className="select-none text-[var(--adm-ink-subtle)]">&mdash;</span>;
}

/**
 * Select styled to sit inside a table cell.
 *
 * A bare <select> renders with the operating system's own chrome, grey bevel
 * on Windows, a different metric on macOS, which is jarring next to designed
 * controls and was the most obviously unfinished thing on the bench table.
 * appearance-none plus our own chevron makes it match everything else while
 * staying a real native select (so keyboard and mobile pickers still work).
 */
export function InlineSelect({
  value,
  onChange,
  className,
  children,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Tone classes for the current value, e.g. status colours. */
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <span className="relative inline-flex">
      <select
        value={value}
        onChange={onChange}
        autoComplete="off"
        aria-label={ariaLabel}
        className={cn(
          "cursor-pointer appearance-none rounded-[8px] border py-1 pl-2.5 pr-7 text-[12.5px] font-medium",
          "transition-colors duration-150",
          className,
        )}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}
