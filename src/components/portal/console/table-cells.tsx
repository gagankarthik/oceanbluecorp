"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Cells shared by the list tables, so an empty value and a stacked cell look
// the same on every screen.

/** An empty cell: a quiet dash, read as "none" by screen readers. */
export function Blank() {
  return (
    <span className="select-none text-[var(--adm-ink-subtle)]">
      <span aria-hidden="true">&mdash;</span>
      <span className="sr-only">None</span>
    </span>
  );
}

/** Two lines in one cell: the value, then its supporting detail. */
export function StackCell({ primary, secondary, title }: { primary: React.ReactNode; secondary?: React.ReactNode; title?: string }) {
  return (
    <span className="flex min-w-0 flex-col" title={title}>
      <span className="truncate text-[var(--adm-ink)]">{primary}</span>
      {secondary && <span className="truncate text-adm-xs text-[var(--adm-ink-mute)]">{secondary}</span>}
    </span>
  );
}

/** Roles linked to a client or vendor: open ones lead, the total follows. */
export function RoleCountCell({ total = 0, open = 0 }: { total?: number; open?: number }) {
  if (!total) return <span className="text-adm-xs text-[var(--adm-ink-subtle)]">No roles yet</span>;
  return (
    <span className="flex flex-col tabular-nums" title={`${total} posted, ${open} open`}>
      <span className={cn("text-[var(--adm-ink)]", open > 0 && "font-semibold")}>
        {open > 0 ? `${open} open` : "None open"}
      </span>
      <span className="text-adm-xs text-[var(--adm-ink-mute)]">{total} posted</span>
    </span>
  );
}
