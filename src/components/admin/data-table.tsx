"use client";

import * as React from "react";
import type { IconComponent } from "./icons";
import { ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { IconInbox } from "./icons";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "./empty-state";
import type { Density } from "./workspace";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

// ui/Checkbox defaults to the navy --primary with a drop shadow + a fat 3px
// focus ring. Flatten it and move it onto the admin accent: no shadow, a clean
// hover border, and a tidy 2px accent focus ring.
//
// Whole pixels only. This was size-[17px] with a border-[1.5px]: an odd box
// with a fractional border means neither the outer edges nor the stroke land on
// device pixels, so the browser rounds each of the four sides independently,
// at the 125%/150% display scaling Windows ships by default that lands as 1px
// on some sides and 2px on others, and the "square" visibly isn't one. 16px at
// a 1px border is the same geometry every other checkbox in the app uses, and
// the 40px hit area below comes from the ::before pseudo-element, so nothing is
// harder to click for being a pixel smaller.
const checkboxCobalt =
  // A 40px hit area over the 16px box: a 40px-tall row has the room, and
  // selecting records is the most repeated action in the grid (Fitts's Law,
  // see the .adm-hit note in globals.css). The component's own default is 24px.
  "before:size-10 " +
  "size-4 rounded-[6px] border border-[var(--adm-line)] shadow-none transition-colors " +
  "hover:border-[var(--adm-ink-subtle)] " +
  "focus-visible:ring-2 focus-visible:ring-[var(--adm-focus-ring)] focus-visible:border-[var(--adm-accent)] " +
  "data-[state=checked]:border-[var(--adm-accent)] data-[state=checked]:bg-[var(--adm-accent)] data-[state=checked]:text-white " +
  "data-[state=indeterminate]:border-[var(--adm-accent)] data-[state=indeterminate]:bg-[var(--adm-accent)] data-[state=indeterminate]:text-white";

/**
 * Generic admin data table, sorting, selection, density, column visibility,
 * a pinned identity column and hover-revealed row actions.
 *
 * Column conventions (see DESIGN_SYSTEM.md):
 *  - numbers are right-aligned and tabular-nums
 *  - first column identifies the row (name + avatar), never a raw ID
 *  - secondary columns hide on small screens via hideBelow
 *  - one line per cell; a second fact belongs in its own column or nowhere
 */
export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Provide to make the column sortable. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  /**
   * Hide the column below this width — of THE TABLE, not of the window.
   * A table in a split view or a narrow card sheds its secondary columns at
   * the same point a full-width one does.
   */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  /** Plain-text name for the column-visibility menu. Falls back to `header`. */
  label?: string;
  /** Excluded from the column-visibility menu, identity and action columns. */
  locked?: boolean;
  /** Fixed width, so one column cannot eat the table. */
  width?: string;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Row click target, makes the whole row interactive. */
  onRowClick?: (row: T) => void;
  /** Enable the selection column by passing both props. */
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** Starting rows-per-page. The user can change it from the footer. */
  pageSize?: number;
  /** Offer to the rows-per-page menu. */
  pageSizeOptions?: number[];
  /**
   * Makes rows-per-page CONTROLLED: `pageSize` is used as-is and changes flow
   * through this callback (the page's Display menu owns the setting). The
   * footer's own rows select is hidden to avoid two controls for one value.
   */
  onPageSizeChange?: (n: number) => void;
  /**
   * Plural record name for the footer tally ("… of 161 applications").
   * Naming the records beats a bare figure , "161" alone makes you look back
   * at the page heading to remember what was counted.
   */
  noun?: string;
  /** Remembers the chosen page size across visits. */
  storageKey?: string;
  /** Extra control in the footer, e.g. a clear-filters link. */
  footerExtra?: React.ReactNode;
  loading?: boolean;
  /** Shown when rows is empty (and not loading). */
  empty?: {
    icon?: IconComponent;
    title: string;
    description?: string;
    action?: React.ReactNode;
  };
  initialSort?: { key: string; dir: "asc" | "desc" };
  /** Row height preset. Cell type size is unaffected. */
  density?: Density;
  /** Column keys to hide, from the columns menu. */
  hiddenColumns?: string[];
  /**
   * Keeps the identity column in place while the grid scrolls sideways. A row
   * whose name has scrolled out of view cannot be read, which is the failure
   * mode of any wide grid.
   */
  pinFirstColumn?: boolean;
  /**
   * Trailing actions, revealed on row hover/focus rather than occupying a
   * permanent column of dot-menus down the whole grid.
   */
  rowActions?: (row: T) => React.ReactNode;
  /** Keep row actions on screen, for a single menu button rather than a row of icons. */
  rowActionsAlways?: boolean;
  /**
   * Optional hard cap on the scroll region.
   *
   * Leave unset. The grid is a flex child of the Workspace panel, so with no
   * cap it grows to fill whatever height the panel has and the rows reach the
   * footer. A fixed `calc(100vh - Nrem)` cap was tried and was wrong on every
   * screen it did not happen to be measured against: the table stopped short
   * and left a band of empty white between the last row and the footer.
   */
  maxHeight?: string;
  className?: string;
}

/* Container widths, not viewport widths. `xl:table-cell` used to reveal a
   column at a 1280px window, where the table itself had ~1000px after the
   sidebar and the pane padding, so the columns that were supposed to appear
   only when there was room appeared when there was not, and the row ran off
   under `overflow-x-hidden`. @md 448 · @xl 576 · @3xl 768 · @5xl 1024. */
const HIDE = {
  sm: "hidden @md:table-cell",
  md: "hidden @xl:table-cell",
  lg: "hidden @3xl:table-cell",
  xl: "hidden @5xl:table-cell",
} as const;

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

const PAGER_BTN =
  "inline-flex h-8 items-center rounded-[6px] border border-[var(--adm-line-control)] bg-[var(--adm-surface)] text-adm-base font-medium text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)] disabled:cursor-not-allowed disabled:opacity-40";

/** Zero-based pages to show: both ends, the current page and its neighbours; null is a gap. */
function pageList(current: number, count: number): (number | null)[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i);
  const keep = new Set([0, 1, count - 2, count - 1, current - 1, current, current + 1]);
  const out: (number | null)[] = [];
  for (let i = 0; i < count; i++) {
    if (keep.has(i)) out.push(i);
    else if (out[out.length - 1] !== null) out.push(null);
  }
  return out;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  selected,
  onSelectedChange,
  pageSize: initialPageSize = 25,
  pageSizeOptions = [25, 50, 100],
  onPageSizeChange,
  noun = "records",
  storageKey,
  footerExtra,
  loading,
  empty,
  initialSort,
  density = "default",
  hiddenColumns,
  pinFirstColumn = false,
  rowActions,
  rowActionsAlways = false,
  maxHeight,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);
  const [page, setPage] = React.useState(0);
  const [scrolled, setScrolled] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Rows-per-page is a preference, so it survives navigation when the caller
  // gives it a key. Read lazily and guarded: a stored value from an older
  // build may no longer be one of the offered options. When the caller passes
  // onPageSizeChange the value is controlled from outside instead.
  const controlled = onPageSizeChange !== undefined;
  const [pageSizeState, setPageSizeState] = React.useState(() => {
    if (typeof window === "undefined" || !storageKey) return initialPageSize;
    const raw = window.localStorage.getItem(`adm.pageSize.${storageKey}`);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && pageSizeOptions.includes(n) ? n : initialPageSize;
  });
  const pageSize = controlled ? initialPageSize : pageSizeState;

  // A controlled page-size change arrives via props, snap back to page one.
  React.useEffect(() => { setPage(0); }, [pageSize]);

  const setPageSize = (n: number) => {
    setPageSizeState(n);
    setPage(0);
    if (storageKey) {
      try { window.localStorage.setItem(`adm.pageSize.${storageKey}`, String(n)); } catch { /* private mode */ }
    }
  };

  const selectable = selected !== undefined && onSelectedChange !== undefined;

  const visibleColumns = React.useMemo(
    () => (hiddenColumns?.length ? columns.filter((c) => !hiddenColumns.includes(c.key)) : columns),
    [columns, hiddenColumns],
  );

  // The pinned column only grows its seam once something has actually scrolled
  // under it; a permanent shadow on an unscrolled grid is just a stray line.
  // Likewise the pinned actions column, while content remains to its left.
  // Table from 1024px, cards below; only one is mounted so cells render once.
  const narrow = useMediaQuery("(max-width: 1023.98px)");
  const [overflowRight, setOverflowRight] = React.useState(false);
  const hasActions = !!rowActions;
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || (!pinFirstColumn && !hasActions)) return;
    const onScroll = () => {
      setScrolled(el.scrollLeft > 0);
      setOverflowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(onScroll);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", onScroll); ro.disconnect(); };
  }, [pinFirstColumn, hasActions, narrow]);

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

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  // Clamp the page when filters shrink the data set.
  React.useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const firstRow = sorted.length === 0 ? 0 : safePage * pageSize + 1;
  const lastRow = Math.min((safePage + 1) * pageSize, sorted.length);

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

  const colSpan = visibleColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

  return (
    // min-w-0 for the same reason as the panel: without it this flex column
    // adopts the table's intrinsic width and pushes its parent wide.
    // @container is what HIDE measures; a container query never applies to the
    // container itself, and every column class sits on a descendant, so the
    // two can share this element.
    <div className={cn("@container flex min-h-0 w-full min-w-0 flex-1 flex-col", className)}>
      {!narrow && (
      <div
        ref={scrollRef}
        data-density={density}
        // `relative` keeps sr-only text in cells (position:absolute) inside this
        // scroller; unpositioned, it escapes and adds blank scroll below the table.
        className="relative min-h-0 flex-1 overflow-auto"
        style={maxHeight ? { maxHeight } : undefined}
      >
        <table
          className={cn(
            "adm-grid text-adm-base",
            pinFirstColumn && "adm-grid--pinned",
            pinFirstColumn && scrolled && "is-scrolled",
            rowActions && "adm-grid--actions",
            rowActions && overflowRight && "has-overflow-right",
          )}
        >
          <thead>
            <tr>
              {selectable && (
                <th className="w-12 pl-5 pr-1">
                  <Checkbox
                    className={checkboxCobalt}
                    checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {visibleColumns.map((col) => {
                const sortable = !!col.sortValue;
                const active = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                    className={cn(
                      "h-10 whitespace-nowrap px-4 first:pl-6 last:pr-6",
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
                          // h-full + min-h so the whole header cell is the sort
                          // target, not just the label's 24px text box.
                          "group/sort inline-flex h-full min-h-[40px] items-center gap-1 transition-colors hover:text-[var(--adm-ink)]",
                          active && "font-semibold text-[var(--adm-accent)]",
                          col.align === "right" && "flex-row-reverse",
                        )}
                      >
                        {col.header}
                        {active ? (
                          sort!.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-0 transition-opacity group-hover/sort:opacity-50" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
              {rowActions && <th className="w-12 px-3" aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: pageSize ? Math.min(pageSize, 12) : 12 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={colSpan} className="px-4">
                    <div
                      className="skel h-3.5"
                      style={{ width: `${85 - (i % 4) * 12}%` }}
                    />
                  </td>
                </tr>
              ))
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={colSpan} style={{ height: "auto" }}>
                  <EmptyState
                    icon={empty?.icon ?? IconInbox}
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
                    data-state={isSelected ? "selected" : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={onRowClick ? (e) => {
                      if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onRowClick(row); }
                    } : undefined}
                    className={cn(
                      "group/row bg-[var(--adm-surface)] transition-colors duration-150",
                      onRowClick && "cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--adm-accent)]",
                      // Selected rows keep an accent spine so the state is
                      // legible even where the hover wash also applies; hover
                      // draws a lighter one, so the pointer has a definite
                      // left edge to track down a wide grid.
                      isSelected
                        ? "!bg-[var(--adm-accent-tint)] shadow-[inset_3px_0_0_var(--adm-accent)]"
                        : "hover:bg-[var(--adm-row-hover)] hover:shadow-[inset_3px_0_0_var(--adm-accent-soft)]",
                    )}
                  >
                    {selectable && (
                      <td className="w-12 pl-5 pr-1" onClick={(e) => e.stopPropagation()}>
                        {/* Always visible: the hover-reveal fade made rows look
                            unselectable (and untouchable on touch screens). */}
                        <Checkbox
                          className={checkboxCobalt}
                          checked={!!isSelected}
                          onCheckedChange={() => toggleRow(id)}
                          aria-label="Select row"
                        />
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        style={col.width ? { width: col.width } : undefined}
                        className={cn(
                          "max-w-[300px] truncate whitespace-nowrap px-4 py-0 first:pl-6 last:pr-6",
                          ALIGN[col.align ?? "left"],
                          col.hideBelow && HIDE[col.hideBelow],
                          col.cellClassName,
                        )}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="w-14 pl-2 pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className={cn("flex justify-end transition-opacity", !rowActionsAlways && "focus-within:opacity-100 lg:opacity-0 lg:group-hover/row:opacity-100 lg:group-focus-visible/row:opacity-100")}>
                          {rowActions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Below 1024px a grid of 6+ columns can't be read, so each row becomes
          a card: the identifying column as its title, the row menu top-right,
          the other visible columns as labelled pairs (at most six, Miller). */}
      {narrow && (
      <div className="min-h-0 flex-1 overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
        {loading ? (
          <ul className="divide-y divide-[var(--adm-line-soft)]" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="space-y-2 px-4 py-3">
                <div className="skel h-4 w-1/2" />
                <div className="skel h-3 w-3/4" />
              </li>
            ))}
          </ul>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={empty?.icon ?? IconInbox}
            title={empty?.title ?? "Nothing here yet"}
            description={empty?.description}
            action={empty?.action}
          />
        ) : (
          <ul className="divide-y divide-[var(--adm-line-soft)]">
            {visible.map((row) => {
              const id = rowKey(row);
              const isSelected = selectable && selected!.includes(id);
              const [lead, ...rest] = visibleColumns;
              return (
                <li
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={onRowClick ? (e) => {
                    if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onRowClick(row); }
                  } : undefined}
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-[var(--adm-row-hover)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--adm-accent)]",
                    isSelected && "bg-[var(--adm-accent-tint)]",
                  )}
                >
                  {selectable && (
                    <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        className={checkboxCobalt}
                        checked={!!isSelected}
                        onCheckedChange={() => toggleRow(id)}
                        aria-label="Select row"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 text-adm-base font-medium text-[var(--adm-ink)]">{lead?.cell(row)}</div>
                      {rowActions && (
                        <div className="-mr-1 -mt-1 flex-none" onClick={(e) => e.stopPropagation()}>
                          {rowActions(row)}
                        </div>
                      )}
                    </div>
                    {rest.length > 0 && (
                      <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1.5 text-adm-xs sm:grid-cols-2">
                        {rest.slice(0, 6).map((col) => (
                          <div key={col.key} className="flex min-w-0 items-baseline gap-2">
                            <dt className="w-24 flex-none text-[var(--adm-ink-mute)]">
                              {col.label ?? (typeof col.header === "string" ? col.header : col.key)}
                            </dt>
                            <dd className="min-w-0 flex-1 truncate text-[var(--adm-ink)]">{col.cell(row)}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      )}

      {/* Single status bar: what you are looking at, how much of it fits, and
          how to move. This replaces the separate WorkspaceFooter, which stated
          the record count a second time directly underneath. It renders even
          on one page, the rows-per-page control is how you get OFF one page. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-[var(--adm-line)] bg-[var(--adm-surface)] px-4 py-2.5">
        <p className="text-adm-xs tabular-nums text-[var(--adm-ink-subtle)]">
          {sorted.length === 0 ? (
            <>No {noun}</>
          ) : (
            <>
              Showing <span className="font-semibold text-[var(--adm-ink-mute)]">{firstRow}</span>
              {" to "}
              <span className="font-semibold text-[var(--adm-ink-mute)]">{lastRow}</span>
              {" of "}
              <span className="font-semibold text-[var(--adm-ink-mute)]">{sorted.length.toLocaleString()}</span>
              {" "}{noun}
            </>
          )}
        </p>

        <div className="flex items-center gap-3">
          {footerExtra}

          {!controlled && (
          <label className="flex items-center gap-2 text-adm-xs text-[var(--adm-ink-subtle)]">
            <span className="hidden sm:inline">Rows</span>
            <span className="relative inline-flex items-center">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                aria-label="Rows per page"
                className="h-9 cursor-pointer appearance-none rounded-[10px] border border-[var(--adm-line-control)] bg-[var(--adm-surface)] pl-2.5 pr-7 text-adm-base font-medium text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)] focus:border-[var(--adm-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)]"
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <svg
                aria-hidden viewBox="0 0 24 24"
                className="pointer-events-none absolute right-2 h-3 w-3 text-[var(--adm-ink-subtle)]"
                fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </label>
          )}

          {pageCount > 1 && (
            <nav aria-label="Pagination" className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className={cn(PAGER_BTN, "gap-1.5 px-2.5")}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sr-only sm:hidden">Previous page</span>
              </button>
              <span className="hidden items-center gap-0.5 sm:flex">
                {pageList(safePage, pageCount).map((n, i) => n === null ? (
                  <span key={`gap-${i}`} aria-hidden="true" className="w-6 text-center text-adm-xs text-[var(--adm-ink-subtle)]">&hellip;</span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    aria-label={`Page ${n + 1}`}
                    aria-current={n === safePage ? "page" : undefined}
                    className={cn(
                      "h-8 min-w-8 rounded-[6px] px-2 text-adm-base font-medium tabular-nums transition-colors",
                      n === safePage
                        ? "bg-[var(--adm-accent)] text-white"
                        : "text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]",
                    )}
                  >
                    {n + 1}
                  </button>
                ))}
              </span>
              <span className="min-w-[56px] text-center text-adm-xs tabular-nums text-[var(--adm-ink-subtle)] sm:hidden">
                <span className="font-semibold text-[var(--adm-ink-mute)]">{safePage + 1}</span> of {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={safePage >= pageCount - 1}
                className={cn(PAGER_BTN, "gap-1.5 px-2.5")}
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sr-only sm:hidden">Next page</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
