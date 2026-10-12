"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, MoreVertical } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { IconComponent } from "./icons";
import { cn } from "@/lib/utils";

// Cells shared by the list tables, so an empty value, a stacked cell and a
// row's actions look the same on every screen.

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

export interface RowMenuItem {
  label: string;
  icon?: IconComponent;
  /** With `href`, runs alongside the navigation (e.g. mark as replied). */
  onSelect?: () => void;
  href?: string;
  /** Opens in a new tab (websites); mailto/tel links open in place. */
  external?: boolean;
  danger?: boolean;
  /** Draws a rule above this item, e.g. before Delete. */
  separated?: boolean;
  /** Locked while its own request runs, so a second click can't repeat it. */
  disabled?: boolean;
}

const ITEM = "cursor-pointer rounded-[6px] px-2 py-1.5 text-adm-xs";

/** The one actions control per row: a ⋮ button that opens a short menu. */
export function RowMenu({ label, items, busy = false }: { label: string; items: RowMenuItem[]; busy?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${label}`}
          onClick={(e) => e.stopPropagation()}
          className="grid h-8 w-8 flex-none place-items-center rounded-[6px] text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)] data-[state=open]:bg-[var(--adm-surface-2)] data-[state=open]:text-[var(--adm-ink)]"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <MoreVertical className="h-4 w-4" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={4}
        onClick={(e) => e.stopPropagation()}
        className="w-52 rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-[var(--adm-shadow-pop)]"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const body = (
            <>
              {Icon && <Icon className={cn("mr-2 h-4 w-4", !item.danger && "text-[var(--adm-ink-subtle)]")} aria-hidden="true" />}
              {item.label}
            </>
          );
          const cls = cn(
            ITEM,
            item.danger && "text-[var(--adm-danger-ink)] focus:bg-[var(--adm-danger-soft)] focus:text-[var(--adm-danger-ink)]",
          );
          return (
            <React.Fragment key={item.label}>
              {item.separated && <DropdownMenuSeparator className="my-1 bg-[var(--adm-line-soft)]" />}
              {item.href ? (
                <DropdownMenuItem asChild className={cls}>
                  {item.external || /^(mailto|tel):/.test(item.href)
                    ? <a href={item.href} onClick={item.onSelect} {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{body}</a>
                    : <Link href={item.href} onClick={item.onSelect}>{body}</Link>}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={item.onSelect} disabled={item.disabled} className={cls}>{body}</DropdownMenuItem>
              )}
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
