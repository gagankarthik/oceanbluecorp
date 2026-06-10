"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "./empty-state";
import { cn } from "@/lib/utils";

// ui/Checkbox defaults to the navy --primary; nudge it to the cobalt accent so
// table selection matches the rest of the admin language.
const checkboxCobalt =
  "border-slate-300 data-[state=checked]:border-[var(--adm-accent)] data-[state=checked]:bg-[var(--adm-accent)] data-[state=indeterminate]:border-[var(--adm-accent)] data-[state=indeterminate]:bg-[var(--adm-accent)] data-[state=indeterminate]:text-white";

/**
 * Generic admin data table — sorting, row selection, pagination, loading
 * and empty states in one place. Render it inside an <AdminCard> with
 * overflow-hidden; pair with SearchInput/FilterToggle/BulkBar for the
 * full list-page pattern.
 *
 * Column conventions (see DESIGN_SYSTEM.md):
 *  - numbers are right-aligned and tabular-nums
 *  - first column identifies the row (name + avatar), never a raw ID
 *  - secondary columns hide on small screens via hideBelow
 */
export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Provide to make the column sortable. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  /** Hide the column below this breakpoint. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Row click target — makes the whole row interactive. */
  onRowClick?: (row: T) => void;
  /** Enable the selection column by passing both props. */
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** Page size; omit to disable pagination. */
  pageSize?: number;
  loading?: boolean;
  /** Shown when rows is empty (and not loading). */
  empty?: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
  };
  initialSort?: { key: string; dir: "asc" | "desc" };
  className?: string;
}

const HIDE = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
} as const;

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  selected,
  onSelectedChange,
  pageSize,
  loading,
  empty,
  initialSort,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);
  const [page, setPage] = React.useState(0);

  const selectable = selected !== undefined && onSelectedChange !== undefined;

  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const sv = col.sortValue;
    return [...rows].sort((a, b) => {
      const va = sv(a), vb = sv(b);
      const cmp = typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: "base" });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const pageCount = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const safePage = Math.min(page, pageCount - 1);
  const visible = pageSize ? sorted.slice(safePage * pageSize, (safePage + 1) * pageSize) : sorted;

  // Clamp the page when filters shrink the data set.
  React.useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const visibleIds = visible.map(rowKey);
  const allVisibleSelected = selectable && visibleIds.length > 0 && visibleIds.every((id) => selected!.includes(id));
  const someVisibleSelected = selectable && visibleIds.some((id) => selected!.includes(id));

  const toggleAll = () => {
    if (!selectable) return;
    onSelectedChange!(
      allVisibleSelected
        ? selected!.filter((id) => !visibleIds.includes(id))
        : [...new Set([...selected!, ...visibleIds])],
    );
  };

  const toggleRow = (id: string) => {
    if (!selectable) return;
    onSelectedChange!(
      selected!.includes(id) ? selected!.filter((s) => s !== id) : [...selected!, id],
    );
  };

  const handleSort = (key: string) => {
    setSort((prev) =>
      prev?.key === key
        ? prev.dir === "asc" ? { key, dir: "desc" } : null
        : { key, dir: "asc" },
    );
    setPage(0);
  };

  const colSpan = columns.length + (selectable ? 1 : 0);

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {selectable && (
                <th className="w-10 px-4 py-2.5">
                  <Checkbox
                    className={checkboxCobalt}
                    checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((col) => {
                const sortable = !!col.sortValue;
                const active = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    className={cn(
                      "px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 first:pl-5 last:pr-5",
                      ALIGN[col.align ?? "left"],
                      col.hideBelow && HIDE[col.hideBelow],
                      col.headerClassName,
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className={cn(
                          "inline-flex items-center gap-1 transition-colors hover:text-slate-700",
                          active && "text-slate-700",
                          col.align === "right" && "flex-row-reverse",
                        )}
                      >
                        {col.header}
                        {active ? (
                          sort!.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-50" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: pageSize ? Math.min(pageSize, 8) : 8 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={colSpan} className="px-5 py-3">
                    <div className="h-5 w-full animate-pulse rounded-md bg-slate-200/70" style={{ maxWidth: `${85 - (i % 4) * 12}%` }} />
                  </td>
                </tr>
              ))
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={colSpan}>
                  <EmptyState
                    icon={empty?.icon ?? Inbox}
                    title={empty?.title ?? "Nothing here yet"}
                    description={empty?.description}
                    action={empty?.action}
                  />
                </td>
              </tr>
            ) : (
              visible.map((row) => {
                const id = rowKey(row);
                const isSelected = selectable && selected!.includes(id);
                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "transition-colors",
                      onRowClick && "cursor-pointer",
                      isSelected ? "bg-[var(--adm-accent-tint)]" : "hover:bg-[var(--adm-accent-tint)]",
                    )}
                  >
                    {selectable && (
                      <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          className={checkboxCobalt}
                          checked={!!isSelected}
                          onCheckedChange={() => toggleRow(id)}
                          aria-label="Select row"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-3 py-3 first:pl-5 last:pr-5",
                          ALIGN[col.align ?? "left"],
                          col.hideBelow && HIDE[col.hideBelow],
                          col.cellClassName,
                        )}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pageSize && sorted.length > pageSize && (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <p className="text-xs tabular-nums text-slate-400">
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              aria-label="Previous page"
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-medium tabular-nums text-slate-600">
              {safePage + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              aria-label="Next page"
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
