"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ============================================================
   ListPanel — the single surface every admin list page sits on.

   Replaces the old four-stack (KPI card row → search card → loose
   count paragraph → table card). Those pushed the first record
   ~400px down the page, and the KPI row mostly restated what the
   segment counts already say.

   Structure is now one bordered panel:
     [ toolbar: search + segment counts + extra controls ]
     [ optional expanded filter drawer                   ]
     [ table                                             ]
     [ footer: record count / pagination                 ]
   ============================================================ */

export function ListPanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("overflow-hidden rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)]", className)}>
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
      <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:gap-4">
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
                    "inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-[var(--adm-accent)] text-white"
                      : "text-[var(--adm-ink-mute)] hover:bg-[var(--adm-line-soft)] hover:text-[var(--adm-ink)]",
                  )}
                >
                  {s.label}
                  <span
                    className={cn(
                      "rounded-[4px] px-1.5 text-[11.5px] font-semibold tabular-nums",
                      active ? "bg-[var(--adm-surface)]/20 text-white" : "bg-[var(--adm-line-soft)] text-[var(--adm-ink-subtle)]",
                    )}
                  >
                    {s.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {trailing && <div className="flex flex-shrink-0 items-center gap-2">{trailing}</div>}
      </div>

      {children && <div className="border-t border-[var(--adm-line)] bg-[var(--adm-surface-sunken)]/60 p-4">{children}</div>}
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
    <div className="flex items-center justify-between gap-4 border-t border-[var(--adm-line)] px-4 py-3">
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
    <thead className="bg-[var(--adm-surface-sunken)]/80">
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
        "px-4 py-3 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[var(--adm-ink-subtle)]",
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
      className={cn("transition-colors hover:bg-[var(--adm-accent-tint)]", onClick && "cursor-pointer", className)}
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
        "px-4 py-3.5 align-middle",
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
 * A bare <select> renders with the operating system's own chrome — grey bevel
 * on Windows, a different metric on macOS — which is jarring next to designed
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
          "cursor-pointer appearance-none rounded-[6px] border py-1 pl-2.5 pr-7 text-[12.5px] font-medium",
          "transition-colors focus:outline-none",
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
