"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterChip {
  key: string;
  /** e.g. "Source" */
  label: string;
  /** e.g. "LinkedIn" */
  value: string;
  onRemove: () => void;
}

/**
 * Active-filter chips — rendered under the toolbar whenever advanced
 * filters are applied, so the state of a filtered list is always visible
 * and individually dismissible (never make users reopen the panel to
 * see why a list looks short).
 *
 * A11y: uses aria-live="polite" so screen readers announce when
 * filters are added or removed without interrupting the user.
 */
export function FilterChips({
  chips,
  onClearAll,
  className,
}: {
  chips: FilterChip[];
  onClearAll?: () => void;
  className?: string;
}) {
  if (chips.length === 0) return null;
  return (
    <div
      role="group"
      aria-label="Active filters"
      aria-live="polite"
      aria-atomic="false"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full border border-[var(--adm-accent-soft)] bg-[var(--adm-accent-soft)] py-1 pl-2.5 pr-1.5 text-xs font-medium text-[var(--adm-accent)]"
        >
          <span className="text-[var(--adm-accent)]/70">{chip.label}:</span>
          {chip.value}
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove ${chip.label}: ${chip.value} filter`}
            className="rounded-full p-0.5 transition-colors hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-[var(--adm-accent)] focus:ring-offset-1"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </span>
      ))}
      {onClearAll && chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          aria-label="Clear all active filters"
          className="px-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 rounded"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
